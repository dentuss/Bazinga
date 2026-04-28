using BazingaComics.Api.Data;
using BazingaComics.Api.Dtos;
using BazingaComics.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/comics")]
public class ComicsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ComicsController(AppDbContext db) => _db = db;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Comic>>> GetAll(CancellationToken ct)
    {
        var comics = await _db.Comics
            .AsNoTracking()
            .Include(c => c.Category)
            .Include(c => c.Condition)
            .Where(c => !c.Redacted)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
        return Ok(comics);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<Comic>> Create([FromBody] ComicCreateRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
        {
            return BadRequest("Title is required.");
        }

        var comic = new Comic
        {
            Title = req.Title!,
            Author = req.Author,
            Isbn = req.Isbn,
            Description = req.Description,
            MainCharacter = req.MainCharacter,
            Series = req.Series,
            PublishedYear = req.PublishedYear,
            ConditionId = req.ConditionId,
            CategoryId = req.CategoryId,
            Price = req.Price,
            Image = req.Image,
            ComicType = EnumParsers.ParseComicType(req.ComicType),
            Redacted = false
        };

        _db.Comics.Add(comic);
        await _db.SaveChangesAsync(ct);
        await _db.Entry(comic).Reference(c => c.Category).LoadAsync(ct);
        await _db.Entry(comic).Reference(c => c.Condition).LoadAsync(ct);
        return StatusCode(StatusCodes.Status201Created, comic);
    }
}
