using System.Text.RegularExpressions;
using BazingaComics.Application.Common.Interfaces;
using BazingaComics.Application.Dtos;
using BazingaComics.Domain.Entities;
using BazingaComics.Web.Security;
using BazingaComics.Application.Abstractions;
using BazingaComics.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Web.Controllers;

[ApiController]
[Route("api/profiles")]
[Authorize]
public class ProfilesController : ControllerBase
{
    private const int MaxProfilesPerUser = 5;
    private const string DefaultAvatarColor = "#E50914";
    private static readonly Regex PinFormat = new("^[0-9]{4}$", RegexOptions.Compiled);

    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;

    public ProfilesController(IAppDbContext db, IPasswordHasher hasher)
    {
        _db = db;
        _hasher = hasher;
    }

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
            // Legacy users (registered before signup auto-created their root)
            // hit this path. Add the root, save, then re-query to converge with
            // any sibling request that raced us (React StrictMode fires two GETs).
            _db.Profiles.Add(new Profile
            {
                UserId = user.Id,
                Name = string.IsNullOrWhiteSpace(user.FirstName) ? user.Username : user.FirstName!,
                AvatarColor = DefaultAvatarColor,
                IsRoot = true,
                IsKids = false,
            });
            try
            {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                // Concurrent request created one too — fine, we'll pick it up below.
            }
            profiles = await _db.Profiles
                .Where(p => p.UserId == user.Id)
                .OrderByDescending(p => p.IsRoot)
                .ThenBy(p => p.Id)
                .ToListAsync(ct);

            // If we somehow ended up with two roots (no unique constraint, two
            // races both succeeded), drop the extras and keep the lowest id.
            var roots = profiles.Where(p => p.IsRoot).OrderBy(p => p.Id).ToList();
            if (roots.Count > 1)
            {
                _db.Profiles.RemoveRange(roots.Skip(1));
                await _db.SaveChangesAsync(ct);
                profiles = await _db.Profiles
                    .Where(p => p.UserId == user.Id)
                    .OrderByDescending(p => p.IsRoot)
                    .ThenBy(p => p.Id)
                    .ToListAsync(ct);
            }
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

        var profile = new Profile
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

    // -----------------------------------------------------------------------
    // PIN management
    // -----------------------------------------------------------------------

    [HttpPut("{id:long}/pin")]
    public async Task<IActionResult> SetPin(long id, [FromBody] SetPinRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == id && p.UserId == user.Id, ct);
        if (profile is null) return NotFound();
        if (string.IsNullOrEmpty(req.Pin) || !PinFormat.IsMatch(req.Pin!))
        {
            return BadRequest("PIN must be exactly 4 digits.");
        }

        // Replacing an existing PIN requires the current one — unless the
        // caller is the root profile, which can override any sub-profile lock.
        if (!string.IsNullOrEmpty(profile.PinHash) && !await CanBypassPinAsync(user, ct))
        {
            if (string.IsNullOrEmpty(req.CurrentPin) || !_hasher.Verify(req.CurrentPin!, profile.PinHash))
            {
                return BadRequest("Current PIN does not match.");
            }
        }

        profile.PinHash = _hasher.Hash(req.Pin!);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:long}/pin")]
    public async Task<IActionResult> RemovePin(long id, [FromBody] RemovePinRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == id && p.UserId == user.Id, ct);
        if (profile is null) return NotFound();
        if (string.IsNullOrEmpty(profile.PinHash)) return NoContent();

        if (!await CanBypassPinAsync(user, ct))
        {
            if (string.IsNullOrEmpty(req.CurrentPin) || !_hasher.Verify(req.CurrentPin!, profile.PinHash))
            {
                return BadRequest("Current PIN does not match.");
            }
        }

        profile.PinHash = null;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("{id:long}/verify-pin")]
    public async Task<IActionResult> VerifyPin(long id, [FromBody] VerifyPinRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == id && p.UserId == user.Id, ct);
        if (profile is null) return NotFound();
        if (string.IsNullOrEmpty(profile.PinHash)) return NoContent();

        if (string.IsNullOrEmpty(req.Pin) || !_hasher.Verify(req.Pin!, profile.PinHash))
        {
            return BadRequest("Incorrect PIN.");
        }
        return NoContent();
    }

    /// <summary>
    /// The root profile can change another profile's PIN without proving the
    /// current one — that's the parental-override path.
    /// </summary>
    private async Task<bool> CanBypassPinAsync(User user, CancellationToken ct)
    {
        // Heuristic: if the caller's session is currently scoped to a root
        // profile we honour the override. With no profile context, we don't.
        if (long.TryParse(Request.Headers["X-Profile-Id"].ToString(), out var callerProfileId))
        {
            return await _db.Profiles.AnyAsync(
                p => p.Id == callerProfileId && p.UserId == user.Id && p.IsRoot, ct);
        }
        return false;
    }

    private static string? NullIfBlank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ProfileDto ToDto(Profile p) => new()
    {
        Id = p.Id,
        UserId = p.UserId,
        Name = p.Name,
        AvatarUrl = p.AvatarUrl,
        AvatarColor = p.AvatarColor,
        AvatarIcon = p.AvatarIcon,
        IsRoot = p.IsRoot,
        IsKids = p.IsKids,
        HasPin = !string.IsNullOrEmpty(p.PinHash),
        CreatedAt = p.CreatedAt == default ? null : p.CreatedAt.ToString("o"),
        UpdatedAt = p.UpdatedAt == default ? null : p.UpdatedAt.ToString("o")
    };
}
