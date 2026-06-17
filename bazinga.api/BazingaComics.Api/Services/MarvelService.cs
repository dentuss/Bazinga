using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using BazingaComics.Api.Dtos;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace BazingaComics.Api.Services;

public interface IMarvelService
{
    bool IsConfigured { get; }
    Task<MarvelPagedResponse> ListComicsAsync(
        int page, int limit, string? titleStartsWith, string? orderBy, CancellationToken ct);
    Task<MarvelComicDto?> GetComicAsync(int id, CancellationToken ct);
}

/// <summary>
/// Marvel Developer API proxy. Comics endpoint is signed with
/// MD5(ts+privateKey+publicKey) on every request — Marvel's own scheme — and
/// every response is cached in-memory so a homepage render stays inside the
/// 3000-call/day developer tier even with multiple users.
/// </summary>
public class MarvelService : IMarvelService
{
    private const int MaxLimit = 100; // Marvel API hard cap
    private static readonly TimeSpan ListCacheTtl = TimeSpan.FromHours(2);
    private static readonly TimeSpan DetailCacheTtl = TimeSpan.FromHours(12);
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly MarvelOptions _options;
    private readonly ILogger<MarvelService> _logger;

    public MarvelService(
        HttpClient http,
        IMemoryCache cache,
        IOptions<MarvelOptions> options,
        ILogger<MarvelService> logger)
    {
        _http = http;
        _cache = cache;
        _options = options.Value;
        _logger = logger;
    }

    public bool IsConfigured => _options.IsConfigured;

    public Task<MarvelPagedResponse> ListComicsAsync(
        int page, int limit, string? titleStartsWith, string? orderBy, CancellationToken ct)
    {
        if (!IsConfigured)
        {
            return Task.FromResult(new MarvelPagedResponse { Configured = false });
        }

        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, MaxLimit);
        var offset = (page - 1) * limit;

        // Sensible defaults so the home rail looks curated:
        //  - format=comic skips trade paperbacks/hardcovers
        //  - noVariants=true drops alternate covers (we already have many issues)
        //  - orderBy=-onsaleDate is newest first; -modified is "recently updated"
        var qs = new List<string>
        {
            $"limit={limit}",
            $"offset={offset}",
            "format=comic",
            "noVariants=true",
            $"orderBy={Uri.EscapeDataString(string.IsNullOrWhiteSpace(orderBy) ? "-onsaleDate" : orderBy!)}",
        };
        if (!string.IsNullOrWhiteSpace(titleStartsWith))
        {
            qs.Add($"titleStartsWith={Uri.EscapeDataString(titleStartsWith!.Trim())}");
        }
        var path = $"comics?{string.Join('&', qs)}";

        return GetListCached(path, ct);
    }

    public async Task<MarvelComicDto?> GetComicAsync(int id, CancellationToken ct)
    {
        if (!IsConfigured) return null;

        return await _cache.GetOrCreateAsync($"marvel:comic:{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = DetailCacheTtl;
            var raw = await GetSignedAsync<MarvelEnvelope<MarvelComicRaw>>($"comics/{id}", ct);
            var item = raw?.Data?.Results?.FirstOrDefault();
            return item is null ? null : MapComic(item);
        });
    }

    private async Task<MarvelPagedResponse> GetListCached(string path, CancellationToken ct)
    {
        return (await _cache.GetOrCreateAsync($"marvel:path:{path}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ListCacheTtl;
            var raw = await GetSignedAsync<MarvelEnvelope<MarvelComicRaw>>(path, ct);
            var data = raw?.Data;
            return new MarvelPagedResponse
            {
                Configured = true,
                Limit = data?.Limit ?? 0,
                Offset = data?.Offset ?? 0,
                Total = data?.Total ?? 0,
                Data = data?.Results?.Select(MapComic).ToList() ?? new(),
            };
        }))!;
    }

    private async Task<T?> GetSignedAsync<T>(string path, CancellationToken ct)
    {
        try
        {
            var signed = SignUrl(path);
            using var resp = await _http.GetAsync(signed, ct);
            if ((int)resp.StatusCode == 429)
            {
                _logger.LogWarning("Marvel rate-limited {Path}", path);
                return default;
            }
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Marvel {Status} for {Path}", (int)resp.StatusCode, path);
                return default;
            }
            return await resp.Content.ReadFromJsonAsync<T>(Json, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Marvel call failed for {Path}", path);
            return default;
        }
    }

    /// <summary>
    /// Marvel auth scheme: append ts / apikey / hash where
    /// hash = md5(ts + privateKey + publicKey). The timestamp is any unique
    /// string — milliseconds since the epoch is the conventional choice.
    /// </summary>
    private string SignUrl(string path)
    {
        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        var raw = ts + _options.PrivateKey + _options.PublicKey;
#pragma warning disable CA5351 // MD5 is mandated by the Marvel API spec; not used for security.
        var hashBytes = MD5.HashData(Encoding.UTF8.GetBytes(raw));
#pragma warning restore CA5351
        var hash = Convert.ToHexString(hashBytes).ToLowerInvariant();
        var sep = path.Contains('?') ? '&' : '?';
        return $"{path}{sep}ts={ts}&apikey={Uri.EscapeDataString(_options.PublicKey!)}&hash={hash}";
    }

    // --- Mapping ----------------------------------------------------------

    private const string ImageNotAvailable = "image_not_available";

    private static MarvelComicDto MapComic(MarvelComicRaw c)
    {
        var creators = c.Creators?.Items?
            .Where(i => !string.IsNullOrWhiteSpace(i.Name))
            .Select(i => i.Name!)
            .Distinct()
            .Take(6)
            .ToList() ?? new List<string>();
        var characters = c.Characters?.Items?
            .Where(i => !string.IsNullOrWhiteSpace(i.Name))
            .Select(i => i.Name!)
            .Take(6)
            .ToList() ?? new List<string>();

        var onsale = c.Dates?
            .FirstOrDefault(d => d.Type == "onsaleDate")?.Date;
        var price = c.Prices?
            .FirstOrDefault(p => p.Type == "printPrice")?.Price;
        var detailUrl = c.Urls?
            .FirstOrDefault(u => u.Type == "detail")?.Url;

        return new MarvelComicDto
        {
            Id = c.Id,
            Title = c.Title ?? "Untitled",
            IssueNumber = (int?)c.IssueNumber,
            Description = string.IsNullOrWhiteSpace(c.Description) ? null : c.Description,
            Image = BuildImageUrl(c.Thumbnail, "portrait_uncanny"),
            Thumbnail = BuildImageUrl(c.Thumbnail, "portrait_incredible"),
            Series = c.Series?.Name,
            Format = c.Format,
            PageCount = c.PageCount,
            OnSaleDate = onsale,
            PrintPrice = price,
            Creators = creators,
            Characters = characters,
            DetailUrl = detailUrl,
        };
    }

    private static string? BuildImageUrl(MarvelImageRaw? img, string variant)
    {
        if (img is null || string.IsNullOrWhiteSpace(img.Path) || string.IsNullOrWhiteSpace(img.Extension))
        {
            return null;
        }
        // Marvel's placeholder for missing art — don't bother surfacing it.
        if (img.Path!.EndsWith(ImageNotAvailable, StringComparison.OrdinalIgnoreCase)) return null;
        var path = img.Path!.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            ? "https://" + img.Path[7..]
            : img.Path;
        return $"{path}/{variant}.{img.Extension}";
    }

    // --- Raw response shapes ----------------------------------------------

    internal class MarvelEnvelope<T>
    {
        [JsonPropertyName("data")] public MarvelDataBlock<T>? Data { get; set; }
    }

    internal class MarvelDataBlock<T>
    {
        [JsonPropertyName("offset")] public int Offset { get; set; }
        [JsonPropertyName("limit")] public int Limit { get; set; }
        [JsonPropertyName("total")] public int Total { get; set; }
        [JsonPropertyName("count")] public int Count { get; set; }
        [JsonPropertyName("results")] public List<T>? Results { get; set; }
    }

    internal class MarvelComicRaw
    {
        [JsonPropertyName("id")] public int Id { get; set; }
        [JsonPropertyName("title")] public string? Title { get; set; }
        [JsonPropertyName("issueNumber")] public double? IssueNumber { get; set; }
        [JsonPropertyName("description")] public string? Description { get; set; }
        [JsonPropertyName("pageCount")] public int? PageCount { get; set; }
        [JsonPropertyName("format")] public string? Format { get; set; }
        [JsonPropertyName("thumbnail")] public MarvelImageRaw? Thumbnail { get; set; }
        [JsonPropertyName("series")] public MarvelSeriesRef? Series { get; set; }
        [JsonPropertyName("creators")] public MarvelCollection<MarvelNamedItem>? Creators { get; set; }
        [JsonPropertyName("characters")] public MarvelCollection<MarvelNamedItem>? Characters { get; set; }
        [JsonPropertyName("dates")] public List<MarvelDate>? Dates { get; set; }
        [JsonPropertyName("prices")] public List<MarvelPrice>? Prices { get; set; }
        [JsonPropertyName("urls")] public List<MarvelUrl>? Urls { get; set; }
    }

    internal class MarvelImageRaw
    {
        [JsonPropertyName("path")] public string? Path { get; set; }
        [JsonPropertyName("extension")] public string? Extension { get; set; }
    }

    internal class MarvelSeriesRef
    {
        [JsonPropertyName("name")] public string? Name { get; set; }
    }

    internal class MarvelCollection<T>
    {
        [JsonPropertyName("items")] public List<T>? Items { get; set; }
    }

    internal class MarvelNamedItem
    {
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("role")] public string? Role { get; set; }
    }

    internal class MarvelDate
    {
        [JsonPropertyName("type")] public string? Type { get; set; }
        [JsonPropertyName("date")] public string? Date { get; set; }
    }

    internal class MarvelPrice
    {
        [JsonPropertyName("type")] public string? Type { get; set; }
        [JsonPropertyName("price")] public decimal? Price { get; set; }
    }

    internal class MarvelUrl
    {
        [JsonPropertyName("type")] public string? Type { get; set; }
        [JsonPropertyName("url")] public string? Url { get; set; }
    }
}
