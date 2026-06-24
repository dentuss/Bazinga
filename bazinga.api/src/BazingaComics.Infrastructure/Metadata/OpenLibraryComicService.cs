using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using BazingaComics.Application.Dtos;
using Microsoft.Extensions.Caching.Memory;

using BazingaComics.Application.Abstractions;

using Microsoft.Extensions.Logging;
namespace BazingaComics.Infrastructure.Metadata;

/// <summary>
/// Comics metadata over the free, no-auth Open Library API — the replacement
/// for Marvel's discontinued developer API. Real covers, authors, years and
/// (on the detail endpoint) descriptions + genres for Marvel/DC/indie comics.
///
/// The default catalogue is a union of curated superhero-franchise searches
/// (same approach as the curated TVMaze show set), fetched once and cached so
/// browsing/paging happens in memory. Free-text searches hit Open Library's
/// search live, restricted to the "Comic books, strips" subject so results
/// stay on-genre.
/// </summary>
public class OpenLibraryComicService : IComicMetadataService
{
    private const int MaxLimit = 50;
    private const string ComicSubject = "Comic books, strips";
    private const string SearchFields = "key,title,author_name,cover_i,first_publish_year,subject";
    private static readonly TimeSpan CuratedTtl = TimeSpan.FromHours(6);
    private static readonly TimeSpan SearchTtl = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan DetailTtl = TimeSpan.FromHours(12);
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static readonly Regex WorkIdPattern = new(@"OL(\d+)W", RegexOptions.Compiled);

    // A Marvel/DC-heavy spread so the catalogue reads as "superhero comics".
    private static readonly string[] CuratedFranchises =
    {
        "Batman", "Superman", "Wonder Woman", "The Flash", "Green Lantern", "Justice League",
        "Spider-Man", "X-Men", "Avengers", "Iron Man", "Captain America", "Thor", "Hulk",
        "Black Panther", "Watchmen", "Hellboy",
    };

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly ILogger<OpenLibraryComicService> _logger;

    public OpenLibraryComicService(HttpClient http, IMemoryCache cache, ILogger<OpenLibraryComicService> logger)
    {
        _http = http;
        _cache = cache;
        _logger = logger;
    }

    public async Task<ComicsMetaPagedResponse> ListAsync(int page, int limit, string? query, CancellationToken ct)
    {
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, MaxLimit);

        // Free-text search → live, on-genre, paged by Open Library itself.
        if (!string.IsNullOrWhiteSpace(query))
        {
            return await SearchAsync(query!.Trim(), page, limit, ct);
        }

        // Default browse → curated union, paged in memory.
        var all = await LoadCuratedAsync(ct);
        var slice = all.Skip((page - 1) * limit).Take(limit).ToList();
        return new ComicsMetaPagedResponse
        {
            Configured = true,
            Page = page,
            Limit = limit,
            Total = all.Count,
            Data = slice,
        };
    }

    public async Task<ComicMetaDto?> GetAsync(int id, CancellationToken ct)
    {
        if (id <= 0) return null;
        return await _cache.GetOrCreateAsync($"comics:ol:work:{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = DetailTtl;
            var raw = await GetJsonAsync<OlWork>($"works/OL{id}W.json", ct);
            if (raw is null) return null;

            var coverId = raw.Covers?.FirstOrDefault(c => c > 0);
            return new ComicMetaDto
            {
                Id = id,
                Title = raw.Title ?? "Untitled",
                Image = CoverUrl(coverId, "L"),
                Thumbnail = CoverUrl(coverId, "M"),
                Description = ExtractDescription(raw.Description),
                Year = ParseYear(raw.FirstPublishDate),
                Genres = CleanSubjects(raw.Subjects),
            };
        });
    }

    // --- Curated default catalogue ----------------------------------------

    private async Task<List<ComicMetaDto>> LoadCuratedAsync(CancellationToken ct)
    {
        return (await _cache.GetOrCreateAsync("comics:ol:curated", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CuratedTtl;

            var tasks = CuratedFranchises.Select(f => SearchRawAsync(f, 1, 18, ct));
            var results = await Task.WhenAll(tasks);

            // Interleave franchises (round-robin) so the rail isn't 18 Batmans
            // in a row, dedupe by work id, and require a cover.
            var byFranchise = results.Select(r => r.Data).ToList();
            var seen = new HashSet<int>();
            var merged = new List<ComicMetaDto>();
            var max = byFranchise.Count == 0 ? 0 : byFranchise.Max(l => l.Count);
            for (var i = 0; i < max; i++)
            {
                foreach (var list in byFranchise)
                {
                    if (i >= list.Count) continue;
                    var item = list[i];
                    if (item.Image is null) continue;
                    if (seen.Add(item.Id)) merged.Add(item);
                }
            }
            return merged;
        }))!;
    }

    // --- Live search ------------------------------------------------------

    private Task<ComicsMetaPagedResponse> SearchAsync(string query, int page, int limit, CancellationToken ct) =>
        _cache.GetOrCreateAsync($"comics:ol:q:{query.ToLowerInvariant()}:{page}:{limit}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = SearchTtl;
            var raw = await SearchRawAsync(query, page, limit, ct);
            return raw;
        })!;

    private async Task<ComicsMetaPagedResponse> SearchRawAsync(string query, int page, int limit, CancellationToken ct)
    {
        var url =
            $"search.json?q={Uri.EscapeDataString(query)}" +
            $"&subject={Uri.EscapeDataString(ComicSubject)}" +
            $"&fields={Uri.EscapeDataString(SearchFields)}" +
            $"&page={page}&limit={limit}";

        var raw = await GetJsonAsync<OlSearchResponse>(url, ct);
        var docs = raw?.Docs ?? new List<OlDoc>();
        return new ComicsMetaPagedResponse
        {
            Configured = true,
            Page = page,
            Limit = limit,
            Total = raw?.NumFound ?? docs.Count,
            Data = docs
                .Where(d => d.CoverId is > 0)
                .Select(MapDoc)
                .Where(c => c.Id > 0)
                .ToList(),
        };
    }

    private static ComicMetaDto MapDoc(OlDoc d) => new()
    {
        Id = ParseWorkId(d.Key),
        Title = d.Title ?? "Untitled",
        Image = CoverUrl(d.CoverId, "L"),
        Thumbnail = CoverUrl(d.CoverId, "M"),
        Year = d.FirstPublishYear,
        Creators = (d.AuthorName ?? new List<string>()).Take(4).ToList(),
        Genres = CleanSubjects(d.Subject),
    };

    // --- Helpers ----------------------------------------------------------

    private async Task<T?> GetJsonAsync<T>(string path, CancellationToken ct)
    {
        try
        {
            using var resp = await _http.GetAsync(path, ct);
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Open Library {Status} for {Path}", (int)resp.StatusCode, path);
                return default;
            }
            return await resp.Content.ReadFromJsonAsync<T>(Json, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Open Library call failed for {Path}", path);
            return default;
        }
    }

    private static int ParseWorkId(string? key)
    {
        if (string.IsNullOrEmpty(key)) return 0;
        var m = WorkIdPattern.Match(key);
        return m.Success && int.TryParse(m.Groups[1].Value, out var n) ? n : 0;
    }

    private static string? CoverUrl(int? coverId, string size) =>
        coverId is > 0 ? $"https://covers.openlibrary.org/b/id/{coverId}-{size}.jpg" : null;

    private static int? ParseYear(string? date)
    {
        if (string.IsNullOrWhiteSpace(date)) return null;
        var m = Regex.Match(date, @"\d{4}");
        return m.Success && int.TryParse(m.Value, out var y) ? y : null;
    }

    private static string? ExtractDescription(JsonElement? description)
    {
        if (description is null) return null;
        var el = description.Value;
        var text = el.ValueKind switch
        {
            JsonValueKind.String => el.GetString(),
            JsonValueKind.Object when el.TryGetProperty("value", out var v) => v.GetString(),
            _ => null,
        };
        if (string.IsNullOrWhiteSpace(text)) return null;
        // Strip Open Library's trailing "([source][1])" markdown footnotes.
        text = Regex.Replace(text, @"\r?\n-+\r?\n.*$", "", RegexOptions.Singleline).Trim();
        return text;
    }

    private static List<string> CleanSubjects(IEnumerable<string>? subjects) =>
        (subjects ?? Enumerable.Empty<string>())
            .Where(s => !string.IsNullOrWhiteSpace(s)
                && !s.Contains(':') && !s.Contains('=')
                && s.Length <= 28
                && !s.StartsWith("Reading Level", StringComparison.OrdinalIgnoreCase)
                && !s.StartsWith("Accessible book", StringComparison.OrdinalIgnoreCase)
                && !s.StartsWith("Protected DAISY", StringComparison.OrdinalIgnoreCase)
                && !s.StartsWith("In library", StringComparison.OrdinalIgnoreCase)
                && !s.StartsWith("Internet Archive", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(6)
            .ToList();

    // --- Raw Open Library response shapes ---------------------------------

    private class OlSearchResponse
    {
        [JsonPropertyName("numFound")] public int NumFound { get; set; }
        [JsonPropertyName("docs")] public List<OlDoc>? Docs { get; set; }
    }

    private class OlDoc
    {
        [JsonPropertyName("key")] public string? Key { get; set; }
        [JsonPropertyName("title")] public string? Title { get; set; }
        [JsonPropertyName("author_name")] public List<string>? AuthorName { get; set; }
        [JsonPropertyName("cover_i")] public int? CoverId { get; set; }
        [JsonPropertyName("first_publish_year")] public int? FirstPublishYear { get; set; }
        [JsonPropertyName("subject")] public List<string>? Subject { get; set; }
    }

    private class OlWork
    {
        [JsonPropertyName("title")] public string? Title { get; set; }
        [JsonPropertyName("description")] public JsonElement? Description { get; set; }
        [JsonPropertyName("subjects")] public List<string>? Subjects { get; set; }
        [JsonPropertyName("covers")] public List<int>? Covers { get; set; }
        [JsonPropertyName("first_publish_date")] public string? FirstPublishDate { get; set; }
    }
}
