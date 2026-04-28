using BazingaComics.Api.Data;
using BazingaComics.Api.Dtos;
using BazingaComics.Api.Entities;
using BazingaComics.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtService _jwt;

    public AuthController(AppDbContext db, IPasswordHasher hasher, IJwtService jwt)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] AuthRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest("Email, username and password are required.");
        }

        if (await _db.Users.AnyAsync(u => u.Email == req.Email, ct))
        {
            return BadRequest("Email already registered.");
        }

        if (await _db.Users.AnyAsync(u => u.Username == req.Username, ct))
        {
            return BadRequest("Username already taken.");
        }

        var user = new User
        {
            Email = req.Email!,
            Username = req.Username!,
            Password = _hasher.Hash(req.Password!),
            Role = "USER",
            SubscriptionType = "Free"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return Ok(BuildResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] AuthRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email || u.Username == req.Email, ct);
        if (user is null || !_hasher.Verify(req.Password!, user.Password))
        {
            return Unauthorized("Invalid credentials.");
        }

        return Ok(BuildResponse(user));
    }

    private AuthResponse BuildResponse(User user) => new()
    {
        Token = _jwt.GenerateToken(user),
        UserId = user.Id,
        Username = user.Username,
        Email = user.Email,
        Role = string.IsNullOrWhiteSpace(user.Role) ? "USER" : user.Role,
        FirstName = user.FirstName,
        LastName = user.LastName,
        DateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
        SubscriptionType = user.SubscriptionType,
        SubscriptionExpiration = user.SubscriptionExpiration?.ToString("yyyy-MM-dd"),
        CreatedAt = user.CreatedAt == default ? null : user.CreatedAt.ToString("o"),
        UpdatedAt = user.UpdatedAt == default ? null : user.UpdatedAt.ToString("o")
    };
}
