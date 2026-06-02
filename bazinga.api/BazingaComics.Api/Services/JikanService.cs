using System.Net.Http.Json;
using System.Text.Json;
using BazingaComics.Api.Dtos;
using Microsoft.Extensions.Caching.Memory;

namespace BazingaComics.Api.Services;

public class JikanService : IJikanService
{
    private static readonly TimeSpan ListCacheTtl = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan DetailCacheTtl = TimeSpan.FromHours(1);
    private static readonly TimeSpan GenreCacheTtl = TimeSpan.FromHours(24);
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly ILogger<JikanService> _logger;

    public JikanService(HttpClient http, IMemoryCache cache, ILogger<JikanService> logger)
    {
        _http = http;
        _cache = cache;
        _logger = logger;
    }

    // ---------- Anime ------------------------------------------------------

    public Task<JikanPagedResponse<AnimeDto>> TopAnimeAsync(int page, int limit, CancellationToken ct) =>
        GetPagedCached($"top/anime?page={page}&limit={limit}", ListCacheTtl, MapAnime, ct);

    public Task<JikanPagedResponse<AnimeDto>> SeasonNowAsync(int page, int limit, CancellationToken ct) =>
        GetPagedCached($"seasons/now?page={page}&limit={limit}", ListCacheTtl, MapAnime, ct);

    public Task<JikanPagedResponse<AnimeDto>> SeasonUpcomingAsync(int page, int limit, CancellationToken ct) =>
        GetPagedCached($"seasons/upcoming?page={page}&limit={limit}", ListCacheTtl, MapAnime, ct);

    public Task<JikanPagedResponse<AnimeDto>> SearchAnimeAsync(
        string? query, int page, int limit,
        int? genre, string? status, string? type, string? orderBy,
        CancellationToken ct)
    {
        var url = BuildUrl("anime", q =>
        {
            q["page"] = page.ToString();
            q["limit"] = limit.ToString();
            if (!string.IsNullOrWhiteSpace(query)) q["q"] = query;
            if (genre.HasValue) q["genres"] = genre.Value.ToString();
            if (!string.IsNullOrWhiteSpace(status)) q["status"] = status;
            if (!string.IsNullOrWhiteSpace(type)) q["type"] = type;
            if (!string.IsNullOrWhiteSpace(orderBy)) q["order_by"] = orderBy;
            q["sfw"] = "true";
        });
        return GetPagedCached(url, ListCacheTtl, MapAnime, ct);
    }

    public async Task<AnimeDto?> AnimeDetailAsync(long id, CancellationToken ct)
    {
        return await _cache.GetOrCreateAsync($"anime:{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = DetailCacheTtl;
            var raw = await GetJsonAsync<JikanEnvelope<JikanAnime>>($"anime/{id}/full", ct);
            return raw?.Data is null ? null : MapAnime(raw.Data);
        });
    }

    public Task<List<GenreDto>> AnimeGenresAsync(CancellationToken ct) =>
        GenresAsync("anime", ct);

    // ---------- Manga ------------------------------------------------------

    public Task<JikanPagedResponse<MangaDto>> TopMangaAsync(int page, int limit, CancellationToken ct) =>
        GetPagedCached($"top/manga?page={page}&limit={limit}", ListCacheTtl, MapManga, ct);

    public Task<JikanPagedResponse<MangaDto>> SearchMangaAsync(
        string? query, int page, int limit,
        int? genre, string? status, string? orderBy,
        CancellationToken ct)
    {
        var url = BuildUrl("manga", q =>
        {
            q["page"] = page.ToString();
            q["limit"] = limit.ToString();
            if (!string.IsNullOrWhiteSpace(query)) q["q"] = query;
            if (genre.HasValue) q["genres"] = genre.Value.ToString();
            if (!string.IsNullOrWhiteSpace(status)) q["status"] = status;
            if (!string.IsNullOrWhiteSpace(orderBy)) q["order_by"] = orderBy;
            q["sfw"] = "true";
        });
        return GetPagedCached(url, ListCacheTtl, MapManga, ct);
    }

    public async Task<MangaDto?> MangaDetailAsync(long id, CancellationToken ct)
    {
        return await _cache.GetOrCreateAsync($"manga:{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = DetailCacheTtl;
            var raw = await GetJsonAsync<JikanEnvelope<JikanManga>>($"manga/{id}/full", ct);
            return raw?.Data is null ? null : MapManga(raw.Data);
        });
    }

    public Task<List<GenreDto>> MangaGenresAsync(CancellationToken ct) =>
        GenresAsync("manga", ct);

    // ---------- Plumbing ---------------------------------------------------

    private async Task<List<GenreDto>> GenresAsync(string kind, CancellationToken ct)
    {
        return (await _cache.GetOrCreateAsync($"genres:{kind}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = GenreCacheTtl;
            var raw = await GetJsonAsync<JikanEnvelope<List<JikanCountedEntity>>>($"genres/{kind}", ct);
            return raw?.Data?.Select(g => new GenreDto
            {
                MalId = g.MalId,
                Name = g.Name ?? "Unknown",
                Count = g.Count,
            }).ToList() ?? new List<GenreDto>();
        }))!;
    }

    private async Task<JikanPagedResponse<TDto>> GetPagedCached<TRaw, TDto>(
        string path,
        TimeSpan ttl,
        Func<TRaw, TDto> map,
        CancellationToken ct)
        where TRaw : class
    {
        return (await _cache.GetOrCreateAsync($"path:{path}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ttl;
            var raw = await GetJsonAsync<JikanEnvelope<List<TRaw>>>(path, ct);
            return new JikanPagedResponse<TDto>
            {
                Data = raw?.Data?.Select(map).ToList() ?? new(),
                Pagination = new JikanPagination
                {
                    CurrentPage = raw?.Pagination?.CurrentPage ?? 1,
                    LastVisiblePage = raw?.Pagination?.LastVisiblePage ?? 1,
                    HasNextPage = raw?.Pagination?.HasNextPage ?? false,
                    TotalItems = raw?.Pagination?.Items?.Total,
                },
            };
        }))!;
    }

    private async Task<T?> GetJsonAsync<T>(string path, CancellationToken ct)
    {
        try
        {
            using var resp = await _http.GetAsync(path, ct);
            if (resp.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                _logger.LogWarning("Jikan rate-limited the request for {Path}", path);
                return default;
            }
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Jikan {Status} for {Path}", (int)resp.StatusCode, path);
                return default;
            }
            return await resp.Content.ReadFromJsonAsync<T>(Json, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Jikan call failed for {Path}", path);
            return default;
        }
    }

    private static string BuildUrl(string path, Action<Dictionary<string, string>> withQuery)
    {
        var qs = new Dictionary<string, string>();
        withQuery(qs);
        if (qs.Count == 0) return path;
        var pairs = qs.Select(kvp =>
            $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value)}");
        return $"{path}?{string.Join("&", pairs)}";
    }

    // ---------- Mapping ----------------------------------------------------

    private static AnimeDto MapAnime(JikanAnime a) => new()
    {
        MalId = a.MalId,
        Title = a.TitleEnglish ?? a.Title ?? "Untitled",
        TitleEnglish = a.TitleEnglish,
        Synopsis = a.Synopsis,
        Type = a.Type,
        Episodes = a.Episodes,
        Status = a.Status,
        ImageUrl = a.Images?.Jpg?.ImageUrl,
        LargeImageUrl = a.Images?.Jpg?.LargeImageUrl ?? a.Images?.Jpg?.ImageUrl,
        TrailerEmbedUrl = a.Trailer?.EmbedUrl,
        TrailerImageUrl = a.Trailer?.Images?.MaximumImageUrl
                          ?? a.Trailer?.Images?.LargeImageUrl
                          ?? a.Trailer?.Images?.MediumImageUrl,
        Score = a.Score,
        Rank = a.Rank,
        Year = a.Year,
        Rating = a.Rating,
        Genres = (a.Genres ?? new()).Concat(a.Themes ?? new())
            .Select(g => g.Name ?? "").Where(n => !string.IsNullOrEmpty(n)).Distinct().ToList(),
        Studios = (a.Studios ?? new())
            .Select(s => s.Name ?? "").Where(n => !string.IsNullOrEmpty(n)).ToList(),
    };

    private static MangaDto MapManga(JikanManga m) => new()
    {
        MalId = m.MalId,
        Title = m.TitleEnglish ?? m.Title ?? "Untitled",
        TitleEnglish = m.TitleEnglish,
        Synopsis = m.Synopsis,
        Type = m.Type,
        Chapters = m.Chapters,
        Volumes = m.Volumes,
        Status = m.Status,
        ImageUrl = m.Images?.Jpg?.ImageUrl,
        LargeImageUrl = m.Images?.Jpg?.LargeImageUrl ?? m.Images?.Jpg?.ImageUrl,
        Score = m.Score,
        Rank = m.Rank,
        Genres = (m.Genres ?? new()).Concat(m.Themes ?? new())
            .Select(g => g.Name ?? "").Where(n => !string.IsNullOrEmpty(n)).Distinct().ToList(),
        Authors = (m.Authors ?? new())
            .Select(a => a.Name ?? "").Where(n => !string.IsNullOrEmpty(n)).ToList(),
    };
}
