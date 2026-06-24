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
[Route("api/cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly IAppDbContext _db;

    public CartController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CartItem>>> Get(CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();
        var cart = await GetOrCreateCart(user, ct);
        return Ok(await LoadItems(cart.Id, ct));
    }

    [HttpPost]
    public async Task<ActionResult<IEnumerable<CartItem>>> Add([FromBody] CartItemRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();
        if (req.ComicId is null) return BadRequest("comicId is required.");

        var comic = await _db.Comics.FindAsync(new object?[] { req.ComicId.Value }, ct);
        if (comic is null) return NotFound("Comic not found.");

        var cart = await GetOrCreateCart(user, ct);

        var purchaseType = EnumParsers.ParsePurchaseType(req.PurchaseType);
        if (comic.ComicType == ComicType.ONLY_DIGITAL)
        {
            purchaseType = PurchaseType.DIGITAL;
        }

        var quantity = Math.Max(1, req.Quantity);
        var unitPrice = PricingService.CalculateUnitPrice(comic, purchaseType, user);

        var existing = await _db.CartItems
            .FirstOrDefaultAsync(i => i.CartId == cart.Id && i.ComicId == comic.Id && i.PurchaseType == purchaseType, ct);

        if (existing is null)
        {
            _db.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ComicId = comic.Id,
                Quantity = quantity,
                PurchaseType = purchaseType,
                UnitPrice = unitPrice
            });
        }
        else
        {
            existing.Quantity += quantity;
            existing.UnitPrice = unitPrice;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(await LoadItems(cart.Id, ct));
    }

    [HttpPut]
    public async Task<ActionResult<IEnumerable<CartItem>>> Update([FromBody] CartItemRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();
        if (req.CartItemId is null) return BadRequest("cartItemId is required.");

        var cart = await GetOrCreateCart(user, ct);
        var item = await _db.CartItems.FirstOrDefaultAsync(i => i.Id == req.CartItemId.Value && i.CartId == cart.Id, ct);
        if (item is null) return NotFound();

        if (req.Quantity <= 0)
        {
            _db.CartItems.Remove(item);
        }
        else
        {
            item.Quantity = req.Quantity;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(await LoadItems(cart.Id, ct));
    }

    [HttpDelete("{cartItemId:long}")]
    public async Task<ActionResult<IEnumerable<CartItem>>> Remove(long cartItemId, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var cart = await GetOrCreateCart(user, ct);
        var item = await _db.CartItems.FirstOrDefaultAsync(i => i.Id == cartItemId && i.CartId == cart.Id, ct);
        if (item is not null)
        {
            _db.CartItems.Remove(item);
            await _db.SaveChangesAsync(ct);
        }
        return Ok(await LoadItems(cart.Id, ct));
    }

    [HttpDelete]
    public async Task<ActionResult<IEnumerable<CartItem>>> Clear(CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();
        var cart = await GetOrCreateCart(user, ct);
        await _db.CartItems.Where(i => i.CartId == cart.Id).ExecuteDeleteAsync(ct);
        return Ok(Array.Empty<CartItem>());
    }

    private async Task<Cart> GetOrCreateCart(User user, CancellationToken ct)
    {
        var cart = await _db.Carts.FirstOrDefaultAsync(c => c.UserId == user.Id, ct);
        if (cart is null)
        {
            cart = new Cart { UserId = user.Id };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync(ct);
        }
        return cart;
    }

    private Task<List<CartItem>> LoadItems(long cartId, CancellationToken ct) =>
        _db.CartItems
            .AsNoTracking()
            .Include(i => i.Comic)
            .Where(i => i.CartId == cartId)
            .OrderBy(i => i.Id)
            .ToListAsync(ct);
}
