using BazingaComics.Api.Data;
using BazingaComics.Api.Dtos;
using BazingaComics.Api.Entities;
using BazingaComics.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/wishlist")]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly AppDbContext _db;

    public WishlistController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WishlistItem>>> Get(CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();
        var wishlist = await GetOrCreateWishlist(user, ct);
        return Ok(await LoadItems(wishlist.Id, ct));
    }

    [HttpPost]
    public async Task<ActionResult<IEnumerable<WishlistItem>>> Add([FromBody] WishlistItemRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var comic = await _db.Comics.FindAsync(new object?[] { req.ComicId }, ct);
        if (comic is null) return NotFound("Comic not found.");

        var wishlist = await GetOrCreateWishlist(user, ct);
        var existing = await _db.WishlistItems
            .FirstOrDefaultAsync(i => i.WishlistId == wishlist.Id && i.ComicId == req.ComicId, ct);
        if (existing is null)
        {
            _db.WishlistItems.Add(new WishlistItem
            {
                WishlistId = wishlist.Id,
                ComicId = req.ComicId,
                AddedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync(ct);
        }

        return Ok(await LoadItems(wishlist.Id, ct));
    }

    [HttpDelete("{comicId:long}")]
    public async Task<ActionResult<IEnumerable<WishlistItem>>> Remove(long comicId, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var wishlist = await GetOrCreateWishlist(user, ct);
        await _db.WishlistItems
            .Where(i => i.WishlistId == wishlist.Id && i.ComicId == comicId)
            .ExecuteDeleteAsync(ct);
        return Ok(await LoadItems(wishlist.Id, ct));
    }

    private async Task<Wishlist> GetOrCreateWishlist(User user, CancellationToken ct)
    {
        var wishlist = await _db.Wishlists.FirstOrDefaultAsync(w => w.UserId == user.Id, ct);
        if (wishlist is null)
        {
            wishlist = new Wishlist { UserId = user.Id };
            _db.Wishlists.Add(wishlist);
            await _db.SaveChangesAsync(ct);
        }
        return wishlist;
    }

    private Task<List<WishlistItem>> LoadItems(long wishlistId, CancellationToken ct) =>
        _db.WishlistItems
            .AsNoTracking()
            .Include(i => i.Comic)
            .Where(i => i.WishlistId == wishlistId)
            .OrderBy(i => i.Id)
            .ToListAsync(ct);
}
