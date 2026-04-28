using BazingaComics.Api.Data;
using BazingaComics.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/conditions")]
[AllowAnonymous]
public class ConditionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ConditionsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ComicCondition>>> GetAll(CancellationToken ct) =>
        Ok(await _db.Conditions.AsNoTracking().OrderBy(c => c.Description).ToListAsync(ct));
}
