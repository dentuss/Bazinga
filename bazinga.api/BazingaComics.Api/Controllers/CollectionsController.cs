using BazingaComics.Api.Data;
using BazingaComics.Api.Dtos;
using BazingaComics.Api.Entities;
using BazingaComics.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Controllers;

/// <summary>
/// Per-profile saved collections. <c>library</c> holds comics + manga (Comics
/// side); <c>mylist</c> holds anime + shows (BazingaTV side). The active
/// profile is taken from the <c>X-Profile-Id</c> header (or <c>?profileId=</c>)
/// and validated to belong to the authenticated user; if absent we fall back to
/// the user's root profile so the endpoints never hard-fail.
/// </summary>
[ApiController]
[Route("api/collections")]
[Authorize]
public class CollectionsController : ControllerBase
{
    private static readonly string[] AllowedCollections = { "library", "mylist" };
    private static readonly string[] AllowedKinds = { "comic", "manga", "anime", "show" };

    private readonly AppDbContext _db;

    public CollectionsController(AppDbContext db) => _db = db;

    [HttpGet("{collection}")]
    public async Task<ActionResult<IEnumerable<CollectionItemDto>>> Get(
        string collection,
        [FromQuery] string? kind,
        CancellationToken ct)
    {
        collection = collection.ToLowerInvariant();
        if (!AllowedCollections.Contains(collection)) return NotFound();

        var profile = await ResolveProfileAsync(ct);
        if (profile is null) return Unauthorized();

        return Ok(await LoadItemsAsync(profile.Id, collection, NormalizeKind(kind), ct));
    }

    [HttpPost("{collection}")]
    public async Task<ActionResult<IEnumerable<CollectionItemDto>>> Add(
        string collection,
        [FromBody] CollectionItemRequest req,
        CancellationToken ct)
    {
        collection = collection.ToLowerInvariant();
        if (!AllowedCollections.Contains(collection)) return NotFound();

        var kind = (req.Kind ?? "").ToLowerInvariant();
        if (!AllowedKinds.Contains(kind)) return BadRequest("Unknown kind.");
        if (string.IsNullOrWhiteSpace(req.ContentId)) return BadRequest("contentId is required.");

        var profile = await ResolveProfileAsync(ct);
        if (profile is null) return Unauthorized();

        var contentId = req.ContentId.Trim();
        var exists = await _db.CollectionItems.AnyAsync(
            i => i.ProfileId == profile.Id && i.Collection == collection && i.Kind == kind && i.ContentId == contentId,
            ct);

        if (!exists)
        {
            _db.CollectionItems.Add(new ProfileCollectionItem
            {
                ProfileId = profile.Id,
                Collection = collection,
                Kind = kind,
                ContentId = contentId,
                Title = string.IsNullOrWhiteSpace(req.Title) ? contentId : req.Title.Trim(),
                Image = req.Image,
                Subtitle = req.Subtitle,
                PayloadJson = req.PayloadJson,
                AddedAt = DateTime.UtcNow,
            });
            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                // Raced another add for the same item — the unique index held; ignore.
            }
        }

        return Ok(await LoadItemsAsync(profile.Id, collection, null, ct));
    }

    [HttpDelete("{collection}/{kind}/{contentId}")]
    public async Task<ActionResult<IEnumerable<CollectionItemDto>>> Remove(
        string collection,
        string kind,
        string contentId,
        CancellationToken ct)
    {
        collection = collection.ToLowerInvariant();
        if (!AllowedCollections.Contains(collection)) return NotFound();
        kind = kind.ToLowerInvariant();

        var profile = await ResolveProfileAsync(ct);
        if (profile is null) return Unauthorized();

        await _db.CollectionItems
            .Where(i => i.ProfileId == profile.Id && i.Collection == collection && i.Kind == kind && i.ContentId == contentId)
            .ExecuteDeleteAsync(ct);

        return Ok(await LoadItemsAsync(profile.Id, collection, null, ct));
    }

    private static string? NormalizeKind(string? kind)
    {
        if (string.IsNullOrWhiteSpace(kind)) return null;
        kind = kind.ToLowerInvariant();
        return kind == "all" || !AllowedKinds.Contains(kind) ? null : kind;
    }

    private async Task<List<CollectionItemDto>> LoadItemsAsync(long profileId, string collection, string? kind, CancellationToken ct)
    {
        var query = _db.CollectionItems
            .AsNoTracking()
            .Where(i => i.ProfileId == profileId && i.Collection == collection);
        if (kind is not null) query = query.Where(i => i.Kind == kind);

        var items = await query.OrderByDescending(i => i.Id).ToListAsync(ct);
        return items.Select(ToDto).ToList();
    }

    /// <summary>Resolve the active profile from the request, scoped to the JWT user.</summary>
    private async Task<Entities.Profile?> ResolveProfileAsync(CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return null;

        long? requested = null;
        if (Request.Headers.TryGetValue("X-Profile-Id", out var headerRaw)
            && long.TryParse(headerRaw.ToString(), out var headerId))
        {
            requested = headerId;
        }
        else if (long.TryParse(Request.Query["profileId"], out var queryId))
        {
            requested = queryId;
        }

        if (requested is not null)
        {
            var match = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == requested && p.UserId == user.Id, ct);
            if (match is not null) return match;
        }

        // Fall back to the root (or earliest) profile so a missing header still works.
        return await _db.Profiles
            .Where(p => p.UserId == user.Id)
            .OrderByDescending(p => p.IsRoot)
            .ThenBy(p => p.Id)
            .FirstOrDefaultAsync(ct);
    }

    private static CollectionItemDto ToDto(ProfileCollectionItem i) => new()
    {
        Id = i.Id,
        Collection = i.Collection,
        Kind = i.Kind,
        ContentId = i.ContentId,
        Title = i.Title,
        Image = i.Image,
        Subtitle = i.Subtitle,
        PayloadJson = i.PayloadJson,
        AddedAt = i.AddedAt == default ? "" : i.AddedAt.ToString("o"),
    };
}
