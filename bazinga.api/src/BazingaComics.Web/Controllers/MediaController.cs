using System.Text.Json;
using System.Text.RegularExpressions;
using BazingaComics.Application.Common.Interfaces;
using BazingaComics.Application.Dtos;
using BazingaComics.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Web.Controllers;

/// <summary>
/// Public read surface for the media catalogue (TV/anime series, movies and
/// standalone trailers). Pure data, no auth — what the SPA needs to render
/// the TV hero, the rails and the Watch page.
/// </summary>
[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    private readonly IAppDbContext _db;

    public MediaController(IAppDbContext db) => _db = db;

    /// <summary>List all catalogue items. Optionally filter by kind
    /// (<c>trailer</c>, <c>show</c>, <c>movie</c>) so a rail can request just
    /// one slice. Seasons/episodes are NOT loaded — call the by-slug endpoint
    /// for the full tree.</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MediaItemDto>>> List([FromQuery] string? kind, CancellationToken ct)
    {
        var query = _db.MediaItems.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(kind) &&
            Enum.TryParse<MediaKind>(kind, true, out var parsed))
        {
            query = query.Where(m => m.Kind == parsed);
        }

        var items = await query
            .OrderBy(m => m.SortOrder)
            .ThenByDescending(m => m.CreatedAt)
            .ToListAsync(ct);

        return Ok(items.Select(MediaMapping.ToListDto));
    }

    /// <summary>The featured items rotate through the TV hero.</summary>
    [HttpGet("featured")]
    public async Task<ActionResult<IEnumerable<MediaItemDto>>> Featured(CancellationToken ct)
    {
        var items = await _db.MediaItems
            .AsNoTracking()
            .Where(m => m.IsFeatured)
            .OrderBy(m => m.SortOrder)
            .ThenByDescending(m => m.CreatedAt)
            .ToListAsync(ct);

        return Ok(items.Select(MediaMapping.ToListDto));
    }

    /// <summary>Full detail, including seasons + episodes ordered by their
    /// season/episode numbers — what the Watch page needs.</summary>
    [HttpGet("{slug}")]
    public async Task<ActionResult<MediaItemDto>> Get(string slug, CancellationToken ct)
    {
        var item = await _db.MediaItems
            .AsNoTracking()
            .Include(m => m.Seasons.OrderBy(s => s.SortOrder).ThenBy(s => s.Number))
                .ThenInclude(s => s.Episodes.OrderBy(e => e.Number))
            .FirstOrDefaultAsync(m => m.Slug == slug, ct);

        if (item is null) return NotFound();
        return Ok(MediaMapping.ToDetailDto(item));
    }
}

/// <summary>
/// Shared mapping helpers between the public and admin controllers. Lives
/// inside Web because it's MediaItem ↔ DTO glue, not domain logic.
/// </summary>
internal static class MediaMapping
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    /// <summary>List shape — no children, smaller payload.</summary>
    public static MediaItemDto ToListDto(MediaItem m) => new()
    {
        Id = m.Id,
        Slug = m.Slug,
        Kind = m.Kind.ToString().ToLowerInvariant(),
        Title = m.Title,
        Tagline = m.Tagline,
        Description = m.Description,
        Year = m.Year,
        Rating = m.Rating,
        Genres = ParseStringList(m.GenresJson),
        Badges = ParseStringList(m.BadgesJson),
        BackdropImage = m.BackdropImage,
        PosterImage = m.PosterImage,
        TrailerUrl = m.TrailerUrl,
        IsFeatured = m.IsFeatured,
        SortOrder = m.SortOrder,
    };

    /// <summary>Detail shape — includes the season/episode tree.</summary>
    public static MediaItemDto ToDetailDto(MediaItem m)
    {
        var dto = ToListDto(m);
        dto.Seasons = m.Seasons.Select(s => new MediaSeasonDto
        {
            Id = s.Id,
            Number = s.Number,
            Title = s.Title,
            SortOrder = s.SortOrder,
            Episodes = s.Episodes.Select(e => new MediaEpisodeDto
            {
                Id = e.Id,
                Number = e.Number,
                Title = e.Title,
                Description = e.Description,
                RuntimeMinutes = e.RuntimeMinutes,
                VideoUrl = e.VideoUrl,
                Thumbnail = e.Thumbnail,
            }).ToList(),
        }).ToList();
        return dto;
    }

    public static List<string> ParseStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonOpts) ?? new();
        }
        catch
        {
            // Corrupt/legacy JSON — return empty instead of 500ing the whole list.
            return new();
        }
    }

    public static string SerializeStringList(IEnumerable<string>? values) =>
        JsonSerializer.Serialize(values?.ToList() ?? new(), JsonOpts);

    /// <summary>Slugify a free-form title — lower-case, ASCII, dashes.
    /// Falls back to "media" so we never persist an empty slug.</summary>
    public static string Slugify(string source)
    {
        if (string.IsNullOrWhiteSpace(source)) return "media";
        var lower = source.Trim().ToLowerInvariant();
        var hyphenated = Regex.Replace(lower, @"[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(hyphenated) ? "media" : hyphenated;
    }

    public static MediaKind ParseKind(string? raw) =>
        Enum.TryParse<MediaKind>(raw, true, out var k) ? k : MediaKind.Trailer;
}
