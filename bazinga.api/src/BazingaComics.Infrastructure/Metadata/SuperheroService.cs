using System.Text.Json;
using System.Text.Json.Serialization;
using BazingaComics.Application.Dtos;
using Microsoft.Extensions.Caching.Memory;

using BazingaComics.Application.Abstractions;
using Microsoft.Extensions.Logging;
namespace BazingaComics.Infrastructure.Metadata;

/// <summary>
/// Free, no-auth superhero metadata via:
///   - akabab/superhero-api (static JSON on GitHub Pages) for characters
///   - TVMaze (no auth) for superhero TV shows
/// Both responses are cached in-memory for hours; the akabab dataset only
/// needs to be fetched once per day in practice.
/// </summary>
public class SuperheroService : ISuperheroService
{
    private const string AkababAllUrl =
        "https://akabab.github.io/superhero-api/api/all.json";

    private static readonly TimeSpan CharactersTtl = TimeSpan.FromHours(12);
    private static readonly TimeSpan ShowsTtl = TimeSpan.FromHours(6);

    // A curated palette of searches we issue to TVMaze and merge into a single
    // "superhero shows" feed. TVMaze has no superhero genre/tag, so we lean on
    // brand and headliner queries to get useful coverage.
    private static readonly string[] CuratedShowQueries = new[]
    {
        "marvel", "dc comics", "batman", "superman", "spider-man",
        "x-men", "avengers", "flash", "arrow", "supergirl",
        "daredevil", "punisher", "luke cage", "jessica jones",
        "loki", "hawkeye", "ms marvel", "moon knight", "wandavision",
        "the boys", "invincible", "watchmen", "umbrella academy",
        "peacemaker", "gotham", "smallville", "young justice"
    };

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SuperheroService> _logger;

    public SuperheroService(HttpClient http, IMemoryCache cache, ILogger<SuperheroService> logger)
    {
        _http = http;
        _cache = cache;
        _logger = logger;
    }

    // ---------- Characters (akabab) --------------------------------------

    public async Task<JikanPagedResponse<SuperheroDto>> ListAsync(
        int page, int limit, string? query, string? publisher, string? alignment,
        CancellationToken ct)
    {
        var all = await LoadAllAsync(ct);

        IEnumerable<SuperheroDto> filtered = all;
        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim();
            filtered = filtered.Where(h =>
                h.Name.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                (h.FullName ?? "").Contains(q, StringComparison.OrdinalIgnoreCase) ||
                h.Aliases.Any(a => a.Contains(q, StringComparison.OrdinalIgnoreCase)));
        }
        if (!string.IsNullOrWhiteSpace(publisher))
        {
            filtered = filtered.Where(h =>
                string.Equals(h.Publisher, publisher, StringComparison.OrdinalIgnoreCase));
        }
        if (!string.IsNullOrWhiteSpace(alignment))
        {
            filtered = filtered.Where(h =>
                string.Equals(h.Alignment, alignment, StringComparison.OrdinalIgnoreCase));
        }

        var list = filtered.ToList();
        var safePage = Math.Max(1, page);
        var safeLimit = Math.Clamp(limit, 1, 48);
        var skipped = (safePage - 1) * safeLimit;
        var pageItems = list.Skip(skipped).Take(safeLimit).ToList();
        var lastPage = Math.Max(1, (int)Math.Ceiling(list.Count / (double)safeLimit));

        return new JikanPagedResponse<SuperheroDto>
        {
            Data = pageItems,
            Pagination = new JikanPagination
            {
                CurrentPage = safePage,
                LastVisiblePage = lastPage,
                HasNextPage = safePage < lastPage,
                TotalItems = list.Count,
            },
        };
    }

    public async Task<SuperheroDto?> GetByIdAsync(int id, CancellationToken ct)
    {
        var all = await LoadAllAsync(ct);
        return all.FirstOrDefault(h => h.Id == id);
    }

    public async Task<List<string>> GetPublishersAsync(CancellationToken ct)
    {
        var all = await LoadAllAsync(ct);
        return all
            .Select(h => h.Publisher)
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .Select(p => p!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private Task<List<SuperheroDto>> LoadAllAsync(CancellationToken ct) =>
        _cache.GetOrCreateAsync("superheroes:all", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CharactersTtl;
            _logger.LogInformation("Fetching akabab superhero dataset…");
            try
            {
                using var resp = await _http.GetAsync(AkababAllUrl, ct);
                resp.EnsureSuccessStatusCode();
                var raw = await resp.Content.ReadFromJsonAsync<List<AkababHero>>(JsonOptions, ct)
                          ?? new List<AkababHero>();
                _logger.LogInformation("akabab returned {Count} characters", raw.Count);
                return raw.Select(MapHero).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "akabab fetch failed; serving empty list");
                return new List<SuperheroDto>();
            }
        })!;

    private static SuperheroDto MapHero(AkababHero h) => new()
    {
        Id = h.Id,
        Name = h.Name ?? string.Empty,
        Slug = h.Slug ?? string.Empty,
        FullName = NullIfBlank(h.Biography?.FullName),
        Publisher = NullIfBlank(h.Biography?.Publisher),
        Alignment = NullIfBlank(h.Biography?.Alignment),
        Race = NullIfBlank(h.Appearance?.Race),
        Gender = NullIfBlank(h.Appearance?.Gender),
        Occupation = NullIfBlank(h.Work?.Occupation),
        GroupAffiliation = NullIfBlank(h.Connections?.GroupAffiliation),
        PlaceOfBirth = NullIfBlank(h.Biography?.PlaceOfBirth),
        Aliases = (h.Biography?.Aliases ?? new())
            .Where(a => !string.IsNullOrWhiteSpace(a) && a != "-").ToList(),
        Images = new SuperheroImagesDto
        {
            Xs = h.Images?.Xs,
            Sm = h.Images?.Sm,
            Md = h.Images?.Md,
            Lg = h.Images?.Lg,
        },
        Powerstats = new SuperheroPowerstatsDto
        {
            Intelligence = h.Powerstats?.Intelligence ?? 0,
            Strength = h.Powerstats?.Strength ?? 0,
            Speed = h.Powerstats?.Speed ?? 0,
            Durability = h.Powerstats?.Durability ?? 0,
            Power = h.Powerstats?.Power ?? 0,
            Combat = h.Powerstats?.Combat ?? 0,
        },
    };

    // ---------- Shows (TVMaze) -------------------------------------------

    public async Task<List<SuperheroShowDto>> GetCuratedShowsAsync(CancellationToken ct)
    {
        return (await _cache.GetOrCreateAsync("superhero-shows:curated", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ShowsTtl;
            var bag = new Dictionary<int, SuperheroShowDto>();
            foreach (var query in CuratedShowQueries)
            {
                if (ct.IsCancellationRequested) break;
                try
                {
                    var results = await TvmazeSearchAsync(query, ct);
                    foreach (var show in results)
                    {
                        if (!bag.ContainsKey(show.Id))
                        {
                            bag[show.Id] = show;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "TVMaze search failed for {Query}", query);
                }
            }
            _logger.LogInformation("Built curated superhero-shows feed ({Count} unique)", bag.Count);
            // Prefer shows with cover art + premiere date, more recent first.
            return bag.Values
                .OrderByDescending(s => !string.IsNullOrEmpty(s.ImageMedium))
                .ThenByDescending(s => s.Premiered ?? "")
                .ToList();
        }))!;
    }

    public async Task<List<SuperheroShowDto>> SearchShowsAsync(string query, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(query)) return new List<SuperheroShowDto>();
        var key = $"superhero-shows:search:{query.Trim().ToLowerInvariant()}";
        return (await _cache.GetOrCreateAsync(key, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ShowsTtl;
            return await TvmazeSearchAsync(query, ct);
        }))!;
    }

    public Task<SuperheroShowDto?> GetShowByIdAsync(int id, CancellationToken ct) =>
        _cache.GetOrCreateAsync($"superhero-shows:detail:{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ShowsTtl;
            try
            {
                using var resp = await _http.GetAsync($"https://api.tvmaze.com/shows/{id}", ct);
                if (!resp.IsSuccessStatusCode) return null;
                var raw = await resp.Content.ReadFromJsonAsync<TvmazeShow>(JsonOptions, ct);
                return raw is null ? null : MapShow(raw);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "TVMaze detail failed for {Id}", id);
                return null;
            }
        });

    private async Task<List<SuperheroShowDto>> TvmazeSearchAsync(string query, CancellationToken ct)
    {
        var url = $"https://api.tvmaze.com/search/shows?q={Uri.EscapeDataString(query)}";
        using var resp = await _http.GetAsync(url, ct);
        resp.EnsureSuccessStatusCode();
        var raw = await resp.Content.ReadFromJsonAsync<List<TvmazeSearchEntry>>(JsonOptions, ct)
                  ?? new List<TvmazeSearchEntry>();
        return raw
            .Where(e => e.Show is not null)
            .Select(e => MapShow(e.Show!))
            .ToList();
    }

    private static SuperheroShowDto MapShow(TvmazeShow s) => new()
    {
        Id = s.Id,
        Name = s.Name ?? string.Empty,
        Type = NullIfBlank(s.Type),
        Language = NullIfBlank(s.Language),
        Genres = s.Genres ?? new(),
        Status = NullIfBlank(s.Status),
        Runtime = s.Runtime,
        Premiered = NullIfBlank(s.Premiered),
        Ended = NullIfBlank(s.Ended),
        Summary = NullIfBlank(s.Summary),
        ImageMedium = s.Image?.Medium,
        ImageOriginal = s.Image?.Original,
        NetworkName = s.Network?.Name ?? s.WebChannel?.Name,
        OfficialSite = NullIfBlank(s.OfficialSite),
        Rating = s.Rating?.Average,
    };

    private static string? NullIfBlank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value;

    // ---------- akabab parsing models ------------------------------------

    private sealed class AkababHero
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Slug { get; set; }
        public AkababPowerstats? Powerstats { get; set; }
        public AkababAppearance? Appearance { get; set; }
        public AkababBiography? Biography { get; set; }
        public AkababWork? Work { get; set; }
        public AkababConnections? Connections { get; set; }
        public AkababImages? Images { get; set; }
    }

    private sealed class AkababPowerstats
    {
        public int Intelligence { get; set; }
        public int Strength { get; set; }
        public int Speed { get; set; }
        public int Durability { get; set; }
        public int Power { get; set; }
        public int Combat { get; set; }
    }

    private sealed class AkababAppearance
    {
        public string? Gender { get; set; }
        public string? Race { get; set; }
    }

    private sealed class AkababBiography
    {
        public string? FullName { get; set; }
        public List<string>? Aliases { get; set; }
        [JsonPropertyName("placeOfBirth")] public string? PlaceOfBirth { get; set; }
        public string? Publisher { get; set; }
        public string? Alignment { get; set; }
    }

    private sealed class AkababWork
    {
        public string? Occupation { get; set; }
    }

    private sealed class AkababConnections
    {
        [JsonPropertyName("groupAffiliation")] public string? GroupAffiliation { get; set; }
    }

    private sealed class AkababImages
    {
        public string? Xs { get; set; }
        public string? Sm { get; set; }
        public string? Md { get; set; }
        public string? Lg { get; set; }
    }

    // ---------- TVMaze parsing models ------------------------------------

    private sealed class TvmazeSearchEntry
    {
        public double? Score { get; set; }
        public TvmazeShow? Show { get; set; }
    }

    private sealed class TvmazeShow
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Type { get; set; }
        public string? Language { get; set; }
        public List<string>? Genres { get; set; }
        public string? Status { get; set; }
        public int? Runtime { get; set; }
        public string? Premiered { get; set; }
        public string? Ended { get; set; }
        public string? Summary { get; set; }
        [JsonPropertyName("officialSite")] public string? OfficialSite { get; set; }
        public TvmazeImage? Image { get; set; }
        public TvmazeNetwork? Network { get; set; }
        [JsonPropertyName("webChannel")] public TvmazeNetwork? WebChannel { get; set; }
        public TvmazeRating? Rating { get; set; }
    }

    private sealed class TvmazeImage
    {
        public string? Medium { get; set; }
        public string? Original { get; set; }
    }

    private sealed class TvmazeNetwork
    {
        public string? Name { get; set; }
    }

    private sealed class TvmazeRating
    {
        public double? Average { get; set; }
    }
}
