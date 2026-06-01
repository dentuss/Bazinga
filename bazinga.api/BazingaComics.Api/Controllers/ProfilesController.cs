using BazingaComics.Api.Data;
using BazingaComics.Api.Dtos;
using BazingaComics.Api.Entities;
using BazingaComics.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/profiles")]
[Authorize]
public class ProfilesController : ControllerBase
{
    private const int MaxProfilesPerUser = 5;
    private const string DefaultAvatarColor = "#E50914";

    private readonly AppDbContext _db;

    public ProfilesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProfileDto>>> List(CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var profiles = await _db.Profiles
            .Where(p => p.UserId == user.Id)
            .OrderByDescending(p => p.IsRoot)
            .ThenBy(p => p.Id)
            .ToListAsync(ct);

        if (profiles.Count == 0)
        {
            var root = new Entities.Profile
            {
                UserId = user.Id,
                Name = string.IsNullOrWhiteSpace(user.FirstName) ? user.Username : user.FirstName!,
                AvatarColor = DefaultAvatarColor,
                IsRoot = true,
                IsKids = false
            };
            _db.Profiles.Add(root);
            await _db.SaveChangesAsync(ct);
            profiles.Add(root);
        }

        return Ok(profiles.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<ProfileDto>> Create([FromBody] ProfileUpsertRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Name is required.");

        var count = await _db.Profiles.CountAsync(p => p.UserId == user.Id, ct);
        if (count >= MaxProfilesPerUser)
        {
            return BadRequest($"You can have at most {MaxProfilesPerUser} profiles per account.");
        }

        var profile = new Entities.Profile
        {
            UserId = user.Id,
            Name = req.Name!.Trim(),
            AvatarUrl = NullIfBlank(req.AvatarUrl),
            AvatarColor = string.IsNullOrWhiteSpace(req.AvatarColor) ? DefaultAvatarColor : req.AvatarColor!.Trim(),
            AvatarIcon = NullIfBlank(req.AvatarIcon),
            IsKids = req.IsKids ?? false,
            IsRoot = count == 0
        };

        _db.Profiles.Add(profile);
        await _db.SaveChangesAsync(ct);

        return Ok(ToDto(profile));
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<ProfileDto>> Update(long id, [FromBody] ProfileUpsertRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == id && p.UserId == user.Id, ct);
        if (profile is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.Name)) profile.Name = req.Name!.Trim();
        if (req.AvatarUrl is not null) profile.AvatarUrl = NullIfBlank(req.AvatarUrl);
        if (!string.IsNullOrWhiteSpace(req.AvatarColor)) profile.AvatarColor = req.AvatarColor!.Trim();
        if (req.AvatarIcon is not null) profile.AvatarIcon = NullIfBlank(req.AvatarIcon);
        if (req.IsKids.HasValue) profile.IsKids = req.IsKids.Value;

        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(profile));
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == id && p.UserId == user.Id, ct);
        if (profile is null) return NotFound();

        if (profile.IsRoot) return BadRequest("The main profile cannot be deleted.");

        _db.Profiles.Remove(profile);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static string? NullIfBlank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ProfileDto ToDto(Entities.Profile p) => new()
    {
        Id = p.Id,
        UserId = p.UserId,
        Name = p.Name,
        AvatarUrl = p.AvatarUrl,
        AvatarColor = p.AvatarColor,
        AvatarIcon = p.AvatarIcon,
        IsRoot = p.IsRoot,
        IsKids = p.IsKids,
        CreatedAt = p.CreatedAt == default ? null : p.CreatedAt.ToString("o"),
        UpdatedAt = p.UpdatedAt == default ? null : p.UpdatedAt.ToString("o")
    };
}
