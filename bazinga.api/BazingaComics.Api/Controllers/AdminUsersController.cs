using BazingaComics.Api.Data;
using BazingaComics.Api.Dtos;
using BazingaComics.Api.Entities;
using BazingaComics.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "ADMIN")]
public class AdminUsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _hasher;

    public AdminUsersController(AppDbContext db, IPasswordHasher hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminUserResponse>>> GetAll([FromQuery] string? query, CancellationToken ct)
    {
        IQueryable<User> q = _db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var pattern = $"%{query.Trim()}%";
            q = q.Where(u =>
                EF.Functions.Like(u.Username, pattern) ||
                EF.Functions.Like(u.Email, pattern) ||
                (u.FirstName != null && EF.Functions.Like(u.FirstName, pattern)) ||
                (u.LastName != null && EF.Functions.Like(u.LastName, pattern)));
        }

        var users = await q.OrderBy(u => u.Username).ToListAsync(ct);
        return Ok(users.Select(Map).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<AdminUserResponse>> Create([FromBody] AdminUserRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest("Username, email and password are required.");
        }
        if (await _db.Users.AnyAsync(u => u.Email == req.Email, ct)) return BadRequest("Email already in use.");
        if (await _db.Users.AnyAsync(u => u.Username == req.Username, ct)) return BadRequest("Username already in use.");

        var user = new User
        {
            Username = req.Username!.Trim(),
            Email = req.Email!.Trim(),
            Password = _hasher.Hash(req.Password!),
            FirstName = req.FirstName,
            LastName = req.LastName,
            DateOfBirth = req.DateOfBirth,
            Role = string.IsNullOrWhiteSpace(req.Role) ? "USER" : req.Role!.Trim().ToUpperInvariant(),
            SubscriptionType = "Free"
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return Ok(Map(user));
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<AdminUserResponse>> Update(long id, [FromBody] AdminUserRequest req, CancellationToken ct)
    {
        var user = await _db.Users.FindAsync(new object?[] { id }, ct);
        if (user is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.Username) && req.Username != user.Username)
        {
            if (await _db.Users.AnyAsync(u => u.Username == req.Username && u.Id != id, ct)) return BadRequest("Username already in use.");
            user.Username = req.Username!.Trim();
        }
        if (!string.IsNullOrWhiteSpace(req.Email) && req.Email != user.Email)
        {
            if (await _db.Users.AnyAsync(u => u.Email == req.Email && u.Id != id, ct)) return BadRequest("Email already in use.");
            user.Email = req.Email!.Trim();
        }
        if (!string.IsNullOrWhiteSpace(req.Password))
        {
            user.Password = _hasher.Hash(req.Password!);
        }
        if (req.FirstName is not null) user.FirstName = req.FirstName;
        if (req.LastName is not null) user.LastName = req.LastName;
        if (req.DateOfBirth is not null) user.DateOfBirth = req.DateOfBirth;
        if (!string.IsNullOrWhiteSpace(req.Role)) user.Role = req.Role!.Trim().ToUpperInvariant();

        await _db.SaveChangesAsync(ct);
        return Ok(Map(user));
    }

    private static AdminUserResponse Map(User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        Email = u.Email,
        FirstName = u.FirstName,
        LastName = u.LastName,
        DateOfBirth = u.DateOfBirth,
        Role = u.Role,
        CreatedAt = u.CreatedAt,
        UpdatedAt = u.UpdatedAt
    };
}
