using BazingaComics.Application.Common.Interfaces;
using BazingaComics.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Web.Controllers;

[ApiController]
[Route("api/categories")]
[AllowAnonymous]
public class CategoriesController : ControllerBase
{
    private readonly IAppDbContext _db;
    public CategoriesController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetAll(CancellationToken ct) =>
        Ok(await _db.Categories.AsNoTracking().OrderBy(c => c.Name).ToListAsync(ct));
}
