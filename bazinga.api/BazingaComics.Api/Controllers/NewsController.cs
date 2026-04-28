using BazingaComics.Api.Data;
using BazingaComics.Api.Dtos;
using BazingaComics.Api.Entities;
using BazingaComics.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/news")]
public class NewsController : ControllerBase
{
    private readonly AppDbContext _db;
    public NewsController(AppDbContext db) => _db = db;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<NewsPostResponse>>> GetAll(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var posts = await _db.NewsPosts
            .AsNoTracking()
            .Include(p => p.Author)
            .Where(p => p.ExpiresAt > now)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new NewsPostResponse
            {
                Id = p.Id,
                Title = p.Title,
                Content = p.Content,
                AuthorId = p.AuthorId,
                AuthorUsername = p.Author != null ? p.Author.Username : string.Empty,
                AuthorRole = p.Author != null ? (p.Author.Role ?? string.Empty) : string.Empty,
                CreatedAt = p.CreatedAt,
                ExpiresAt = p.ExpiresAt
            })
            .ToListAsync(ct);

        return Ok(posts);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,EDITOR")]
    public async Task<ActionResult<NewsPostResponse>> Create([FromBody] NewsPostRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var now = DateTime.UtcNow;
        var post = new NewsPost
        {
            Title = req.Title,
            Content = req.Content,
            AuthorId = user.Id,
            CreatedAt = now,
            ExpiresAt = now.AddDays(7)
        };
        _db.NewsPosts.Add(post);
        await _db.SaveChangesAsync(ct);

        return Ok(new NewsPostResponse
        {
            Id = post.Id,
            Title = post.Title,
            Content = post.Content,
            AuthorId = user.Id,
            AuthorUsername = user.Username,
            AuthorRole = user.Role ?? string.Empty,
            CreatedAt = post.CreatedAt,
            ExpiresAt = post.ExpiresAt
        });
    }
}
