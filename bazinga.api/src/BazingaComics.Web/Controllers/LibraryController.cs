using BazingaComics.Application.Common.Interfaces;
using BazingaComics.Application.Dtos;
using BazingaComics.Domain.Entities;
using BazingaComics.Web.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Web.Controllers;

[ApiController]
[Route("api/library")]
[Authorize]
public class LibraryController : ControllerBase
{
    private readonly IAppDbContext _db;

    public LibraryController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LibraryItem>>> Get(CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();
        var library = await GetOrCreateLibrary(user, ct);
        return Ok(await LoadItems(library.Id, ct));
    }

    [HttpPost]
    public async Task<ActionResult<IEnumerable<LibraryItem>>> Add([FromBody] LibraryItemRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var comic = await _db.Comics.FindAsync(new object?[] { req.ComicId }, ct);
        if (comic is null) return NotFound("Comic not found.");

        var library = await GetOrCreateLibrary(user, ct);
        var existing = await _db.LibraryItems
            .FirstOrDefaultAsync(i => i.LibraryId == library.Id && i.ComicId == req.ComicId, ct);

        if (existing is null)
        {
            _db.LibraryItems.Add(new LibraryItem
            {
                LibraryId = library.Id,
                ComicId = req.ComicId,
                AddedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync(ct);
        }

        return Ok(await LoadItems(library.Id, ct));
    }

    private async Task<Library> GetOrCreateLibrary(User user, CancellationToken ct)
    {
        var library = await _db.Libraries.FirstOrDefaultAsync(l => l.UserId == user.Id, ct);
        if (library is null)
        {
            library = new Library { UserId = user.Id };
            _db.Libraries.Add(library);
            await _db.SaveChangesAsync(ct);
        }
        return library;
    }

    private Task<List<LibraryItem>> LoadItems(long libraryId, CancellationToken ct) =>
        _db.LibraryItems
            .AsNoTracking()
            .Include(i => i.Comic)
            .Where(i => i.LibraryId == libraryId)
            .OrderBy(i => i.Id)
            .ToListAsync(ct);
}
