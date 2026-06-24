using BazingaComics.Application.Common.Interfaces;
using BazingaComics.Application.Dtos;
using BazingaComics.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Web.Controllers;

/// <summary>
/// Admin CRUD for the media catalogue. Create/update accept the full season +
/// episode tree as one nested payload; the server diffs against what's on
/// disk and replaces the children atomically so the admin form never has to
/// orchestrate three round-trips.
/// </summary>
[ApiController]
[Route("api/admin/media")]
[Authorize(Roles = "ADMIN")]
public class AdminMediaController : ControllerBase
{
    private readonly IAppDbContext _db;

    public AdminMediaController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MediaItemDto>>> List(CancellationToken ct)
    {
        var items = await _db.MediaItems
            .AsNoTracking()
            .OrderBy(m => m.SortOrder)
            .ThenByDescending(m => m.UpdatedAt)
            .ToListAsync(ct);
        return Ok(items.Select(MediaMapping.ToListDto));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<MediaItemDto>> Get(long id, CancellationToken ct)
    {
        var item = await _db.MediaItems
            .AsNoTracking()
            .Include(m => m.Seasons.OrderBy(s => s.SortOrder).ThenBy(s => s.Number))
                .ThenInclude(s => s.Episodes.OrderBy(e => e.Number))
            .FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item is null) return NotFound();
        return Ok(MediaMapping.ToDetailDto(item));
    }

    [HttpPost]
    public async Task<ActionResult<MediaItemDto>> Create([FromBody] MediaItemUpsertRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Title)) return BadRequest("Title is required.");

        var slug = string.IsNullOrWhiteSpace(req.Slug)
            ? MediaMapping.Slugify(req.Title)
            : MediaMapping.Slugify(req.Slug!);

        // Enforce slug uniqueness up front so we return a friendly 409 instead
        // of a database-level UNIQUE violation surfaced as a 500.
        if (await _db.MediaItems.AnyAsync(m => m.Slug == slug, ct))
        {
            return Conflict($"A media item with slug '{slug}' already exists.");
        }

        var item = new MediaItem
        {
            Slug = slug,
            Kind = MediaMapping.ParseKind(req.Kind),
            Title = req.Title.Trim(),
            Tagline = req.Tagline,
            Description = req.Description,
            Year = req.Year,
            Rating = req.Rating,
            GenresJson = MediaMapping.SerializeStringList(req.Genres),
            BadgesJson = MediaMapping.SerializeStringList(req.Badges),
            BackdropImage = req.BackdropImage,
            PosterImage = req.PosterImage,
            TrailerUrl = req.TrailerUrl,
            IsFeatured = req.IsFeatured,
            SortOrder = req.SortOrder,
        };
        ApplySeasons(item, req.Seasons);

        _db.MediaItems.Add(item);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = item.Id }, MediaMapping.ToDetailDto(item));
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<MediaItemDto>> Update(long id, [FromBody] MediaItemUpsertRequest req, CancellationToken ct)
    {
        var item = await _db.MediaItems
            .Include(m => m.Seasons)
                .ThenInclude(s => s.Episodes)
            .FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item is null) return NotFound();
        if (string.IsNullOrWhiteSpace(req.Title)) return BadRequest("Title is required.");

        var newSlug = string.IsNullOrWhiteSpace(req.Slug)
            ? item.Slug
            : MediaMapping.Slugify(req.Slug!);
        if (newSlug != item.Slug && await _db.MediaItems.AnyAsync(m => m.Slug == newSlug && m.Id != id, ct))
        {
            return Conflict($"A media item with slug '{newSlug}' already exists.");
        }

        item.Slug = newSlug;
        item.Kind = MediaMapping.ParseKind(req.Kind);
        item.Title = req.Title.Trim();
        item.Tagline = req.Tagline;
        item.Description = req.Description;
        item.Year = req.Year;
        item.Rating = req.Rating;
        item.GenresJson = MediaMapping.SerializeStringList(req.Genres);
        item.BadgesJson = MediaMapping.SerializeStringList(req.Badges);
        item.BackdropImage = req.BackdropImage;
        item.PosterImage = req.PosterImage;
        item.TrailerUrl = req.TrailerUrl;
        item.IsFeatured = req.IsFeatured;
        item.SortOrder = req.SortOrder;

        // Replace the season/episode tree atomically. Removing the parents
        // cascades to the episodes via the FK constraint.
        foreach (var s in item.Seasons.ToList())
        {
            _db.MediaSeasons.Remove(s);
        }
        item.Seasons.Clear();
        ApplySeasons(item, req.Seasons);

        await _db.SaveChangesAsync(ct);
        return Ok(MediaMapping.ToDetailDto(item));
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        var item = await _db.MediaItems.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item is null) return NotFound();
        _db.MediaItems.Remove(item);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static void ApplySeasons(MediaItem target, List<MediaSeasonUpsertRequest>? seasons)
    {
        if (seasons is null) return;
        foreach (var s in seasons)
        {
            var season = new MediaSeason
            {
                Number = s.Number,
                Title = s.Title,
                SortOrder = s.SortOrder,
            };
            foreach (var e in s.Episodes ?? new())
            {
                if (string.IsNullOrWhiteSpace(e.VideoUrl)) continue; // skip empty rows from the admin form
                season.Episodes.Add(new MediaEpisode
                {
                    Number = e.Number,
                    Title = string.IsNullOrWhiteSpace(e.Title) ? $"Episode {e.Number}" : e.Title.Trim(),
                    Description = e.Description,
                    RuntimeMinutes = e.RuntimeMinutes,
                    VideoUrl = e.VideoUrl.Trim(),
                    Thumbnail = e.Thumbnail,
                });
            }
            target.Seasons.Add(season);
        }
    }
}
