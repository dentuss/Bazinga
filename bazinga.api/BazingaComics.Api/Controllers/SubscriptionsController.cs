using BazingaComics.Api.Data;
using BazingaComics.Api.Dtos;
using BazingaComics.Api.Security;
using BazingaComics.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/subscriptions")]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBillingService _billing;

    public SubscriptionsController(AppDbContext db, IBillingService billing)
    {
        _db = db;
        _billing = billing;
    }

    /// <summary>
    /// Creates a Stripe SetupIntent for the signed-in user so the checkout
    /// can collect a card via Stripe Elements before changing the plan. When
    /// Stripe isn't configured the response signals the client to fall back
    /// to a mock card form, matching the signup wizard's behaviour.
    /// </summary>
    [HttpPost("billing-intent")]
    public async Task<ActionResult<BillingIntentResponse>> CreateBillingIntent(CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        if (!_billing.IsConfigured)
        {
            return Ok(new BillingIntentResponse { StripeConfigured = false });
        }

        try
        {
            var intent = await _billing.CreateSetupIntentAsync(user.Email, ct);
            return Ok(new BillingIntentResponse
            {
                StripeConfigured = true,
                ClientSecret = intent.ClientSecret,
                CustomerId = intent.CustomerId,
                PublishableKey = _billing.PublishableKey,
            });
        }
        catch (Stripe.StripeException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway,
                $"Stripe rejected the request: {ex.StripeError?.Message ?? ex.Message}");
        }
        catch (OperationCanceledException)
        {
            return StatusCode(StatusCodes.Status504GatewayTimeout,
                "Timed out reaching Stripe. The server may be unable to reach api.stripe.com.");
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status504GatewayTimeout,
                $"Could not reach Stripe ({ex.Message}). Check the server's outbound network access.");
        }
    }

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

        var allowed = new[] { "Comics", "TV", "Unlimited", "Premium" };
        var match = allowed.FirstOrDefault(a => string.Equals(a, type, StringComparison.OrdinalIgnoreCase));
        if (match is null)
        {
            return BadRequest("subscriptionType must be 'Comics', 'TV' or 'Unlimited'.");
        }
        type = match;

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
