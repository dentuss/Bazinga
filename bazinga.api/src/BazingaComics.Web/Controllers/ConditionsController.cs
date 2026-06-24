using BazingaComics.Application.Common.Interfaces;
using BazingaComics.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Web.Controllers;

[ApiController]
[Route("api/conditions")]
[AllowAnonymous]
public class ConditionsController : ControllerBase
{
    private readonly IAppDbContext _db;
    public ConditionsController(IAppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ComicCondition>>> GetAll(CancellationToken ct) =>
        Ok(await _db.Conditions.AsNoTracking().OrderBy(c => c.Description).ToListAsync(ct));
}
