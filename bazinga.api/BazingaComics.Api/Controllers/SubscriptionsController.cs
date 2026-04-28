using BazingaComics.Api.Data;
using BazingaComics.Api.Dtos;
using BazingaComics.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/subscriptions")]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public SubscriptionsController(AppDbContext db) => _db = db;

    [HttpPost("subscribe")]
    public async Task<ActionResult<SubscriptionResponse>> Subscribe([FromBody] SubscriptionRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        var role = user.Role?.Trim().ToUpperInvariant() ?? "USER";
        if (role == "ADMIN")
        {
            return StatusCode(StatusCodes.Status403Forbidden, "Admins cannot subscribe.");
        }
        if (role != "USER" && role != "EDITOR")
        {
            return StatusCode(StatusCodes.Status403Forbidden, "Your role is not allowed to subscribe.");
        }

        var type = (req.SubscriptionType ?? string.Empty).Trim();
        if (string.Equals(type, "Prem", StringComparison.OrdinalIgnoreCase)) type = "Premium";
        if (!string.Equals(type, "Premium", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(type, "Unlimited", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("subscriptionType must be 'Premium' or 'Unlimited'.");
        }
        type = char.ToUpperInvariant(type[0]) + type.Substring(1).ToLowerInvariant();

        var cycle = (req.BillingCycle ?? string.Empty).Trim().ToLowerInvariant();
        if (cycle != "monthly" && cycle != "yearly")
        {
            return BadRequest("billingCycle must be 'monthly' or 'yearly'.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var expiration = cycle == "monthly" ? today.AddMonths(1) : today.AddYears(1);

        user.SubscriptionType = type;
        user.SubscriptionExpiration = expiration;
        await _db.SaveChangesAsync(ct);

        return Ok(new SubscriptionResponse
        {
            SubscriptionType = type,
            SubscriptionExpiration = expiration.ToString("yyyy-MM-dd")
        });
    }
}
