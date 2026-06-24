using BazingaComics.Application.Common.Interfaces;
using BazingaComics.Application.Dtos;
using BazingaComics.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Web.Controllers;

[ApiController]
[Route("api/admin/comics")]
[Authorize(Roles = "ADMIN")]
public class AdminComicsController : ControllerBase
{
    private readonly IAppDbContext _db;

    public AdminComicsController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Comic>>> GetAll(CancellationToken ct)
    {
        var comics = await _db.Comics
            .Include(c => c.Category)
            .Include(c => c.Condition)
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
        return Ok(comics);
    }

    [HttpPut("{id:long}/redaction")]
    public async Task<ActionResult<Comic>> SetRedaction(long id, [FromBody] ComicRedactionRequest req, CancellationToken ct)
    {
        var comic = await _db.Comics.FindAsync(new object?[] { id }, ct);
        if (comic is null) return NotFound();

        comic.Redacted = req.Redacted;
        await _db.SaveChangesAsync(ct);
        return Ok(comic);
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<Comic>> Update(long id, [FromBody] ComicCreateRequest req, CancellationToken ct)
    {
        var comic = await _db.Comics.FindAsync(new object?[] { id }, ct);
        if (comic is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.Title)) comic.Title = req.Title!;
        comic.Author = req.Author;
        comic.Isbn = req.Isbn;
        comic.Description = req.Description;
        comic.MainCharacter = req.MainCharacter;
        comic.Series = req.Series;
        comic.PublishedYear = req.PublishedYear;
        comic.ConditionId = req.ConditionId;
        comic.CategoryId = req.CategoryId;
        comic.Price = req.Price;
        comic.Image = req.Image;
        comic.ComicType = EnumParsers.ParseComicType(req.ComicType);

        await _db.SaveChangesAsync(ct);
        await _db.Entry(comic).Reference(c => c.Category).LoadAsync(ct);
        await _db.Entry(comic).Reference(c => c.Condition).LoadAsync(ct);
        return Ok(comic);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        var comic = await _db.Comics.FindAsync(new object?[] { id }, ct);
        if (comic is null) return NotFound();
        if (!comic.Redacted) return BadRequest("Comic must be redacted before deletion.");

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        await _db.CartItems.Where(i => i.ComicId == id).ExecuteDeleteAsync(ct);
        await _db.WishlistItems.Where(i => i.ComicId == id).ExecuteDeleteAsync(ct);
        await _db.LibraryItems.Where(i => i.ComicId == id).ExecuteDeleteAsync(ct);
        await _db.Reviews.Where(r => r.ComicId == id).ExecuteDeleteAsync(ct);
        await _db.Reports.Where(r => r.ComicId == id).ExecuteDeleteAsync(ct);
        _db.Comics.Remove(comic);
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return NoContent();
    }
}
