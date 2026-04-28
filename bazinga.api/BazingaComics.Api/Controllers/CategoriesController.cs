using BazingaComics.Api.Data;
using BazingaComics.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/categories")]
[AllowAnonymous]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetAll(CancellationToken ct) =>
        Ok(await _db.Categories.AsNoTracking().OrderBy(c => c.Name).ToListAsync(ct));
}
