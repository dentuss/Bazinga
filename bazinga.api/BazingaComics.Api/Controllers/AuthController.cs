using BazingaComics.Api.Data;
using BazingaComics.Api.Dtos;
using BazingaComics.Api.Entities;
using BazingaComics.Api.Security;
using BazingaComics.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const int SignupTokenLifetimeMinutes = 15;

    private readonly AppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtService _jwt;
    private readonly IEmailSender _emailSender;
    private readonly EmailOptions _emailOptions;
    private readonly IBillingService _billing;

    public AuthController(
        AppDbContext db,
        IPasswordHasher hasher,
        IJwtService jwt,
        IEmailSender emailSender,
        IOptions<EmailOptions> emailOptions,
        IBillingService billing)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _emailSender = emailSender;
        _emailOptions = emailOptions.Value;
        _billing = billing;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] AuthRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest("Email, username and password are required.");
        }

        if (await _db.Users.AnyAsync(u => u.Email == req.Email, ct))
        {
            return BadRequest("Email already registered.");
        }

        if (await _db.Users.AnyAsync(u => u.Username == req.Username, ct))
        {
            return BadRequest("Username already taken.");
        }

        var user = new User
        {
            Email = req.Email!,
            Username = req.Username!,
            Password = _hasher.Hash(req.Password!),
            Role = "USER",
            SubscriptionType = "Free"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        EnsureRootProfile(user);
        await _db.SaveChangesAsync(ct);

        return Ok(BuildResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] AuthRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email || u.Username == req.Email, ct);
        if (user is null || !_hasher.Verify(req.Password!, user.Password))
        {
            return Unauthorized("Invalid credentials.");
        }

        return Ok(BuildResponse(user));
    }

    /// <summary>
    /// Quick existence check for the sign-up wizard's first step.
    /// </summary>
    [HttpPost("signup/check")]
    public async Task<ActionResult<EmailAvailabilityResponse>> SignupCheck([FromBody] EmailRequest req, CancellationToken ct)
    {
        var email = req.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email)) return BadRequest("Email is required.");

        var taken = await _db.Users.AnyAsync(u => u.Email == email, ct);
        return Ok(new EmailAvailabilityResponse { Available = !taken });
    }

    /// <summary>
    /// Issues a magic-link email so the user can finish creating their account.
    /// </summary>
    [HttpPost("signup/start")]
    public async Task<IActionResult> SignupStart([FromBody] SignupStartRequest req, CancellationToken ct)
    {
        var email = req.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email)) return BadRequest("Email is required.");

        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
        {
            return Conflict("An account with this email already exists.");
        }

        // Burn any older live tokens for this email so only the freshest link works.
        await _db.SignupTokens
            .Where(t => t.Email == email && t.ConsumedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.ConsumedAt, DateTime.UtcNow), ct);

        var rawToken = SignupTokens.Generate();
        var entity = new SignupToken
        {
            Email = email,
            TokenHash = SignupTokens.Hash(rawToken),
            ExpiresAt = DateTime.UtcNow.AddMinutes(SignupTokenLifetimeMinutes),
            OptOutMarketing = req.OptOutMarketing
        };
        _db.SignupTokens.Add(entity);
        await _db.SaveChangesAsync(ct);

        var baseUrl = _emailOptions.PublicBaseUrl.TrimEnd('/');
        var link = $"{baseUrl}/signup/complete?token={Uri.EscapeDataString(rawToken)}";
        await _emailSender.SendAsync(email, "You're almost there!", BuildSignupEmail(link), ct);

        return NoContent();
    }

    /// <summary>
    /// Confirms the magic link is still valid and returns the email it was sent to.
    /// </summary>
    [HttpGet("signup/verify")]
    public async Task<ActionResult<SignupVerifyResponse>> SignupVerify([FromQuery] string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Ok(new SignupVerifyResponse { Valid = false, Reason = "invalid" });
        }

        var hash = SignupTokens.Hash(token);
        var entity = await _db.SignupTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (entity is null)
        {
            return Ok(new SignupVerifyResponse { Valid = false, Reason = "invalid" });
        }
        if (entity.ConsumedAt is not null)
        {
            return Ok(new SignupVerifyResponse { Valid = false, Reason = "consumed" });
        }
        if (entity.ExpiresAt < DateTime.UtcNow)
        {
            return Ok(new SignupVerifyResponse { Valid = false, Reason = "expired" });
        }
        return Ok(new SignupVerifyResponse { Valid = true, Email = entity.Email });
    }

    /// <summary>
    /// Creates a Stripe SetupIntent for the email behind the magic link so the
    /// signup wizard can collect a card via Stripe Elements. When Stripe isn't
    /// configured the client falls back to a mock card form.
    /// </summary>
    [HttpPost("signup/billing-intent")]
    public async Task<ActionResult<BillingIntentResponse>> SignupBillingIntent(
        [FromBody] BillingIntentRequest req,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token)) return BadRequest("Token is required.");

        var hash = SignupTokens.Hash(req.Token!);
        var entity = await _db.SignupTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (entity is null || entity.ConsumedAt is not null || entity.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest("Invalid or expired sign-up link.");
        }

        if (!_billing.IsConfigured)
        {
            return Ok(new BillingIntentResponse { StripeConfigured = false });
        }

        try
        {
            var intent = await _billing.CreateSetupIntentAsync(entity.Email, ct);
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
            // Bad key, declined request, etc. — Stripe answered, so report it.
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

    /// <summary>
    /// Consumes the magic link, creates the account, and returns an auth token.
    /// </summary>
    [HttpPost("signup/complete")]
    public async Task<ActionResult<AuthResponse>> SignupComplete([FromBody] SignupCompleteRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token)) return BadRequest("Token is required.");
        if (string.IsNullOrWhiteSpace(req.Password) || req.Password!.Length < 6)
        {
            return BadRequest("Password must be at least 6 characters.");
        }

        var hash = SignupTokens.Hash(req.Token!);
        var entity = await _db.SignupTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (entity is null) return BadRequest("Invalid sign-up link.");
        if (entity.ConsumedAt is not null) return BadRequest("This link has already been used.");
        if (entity.ExpiresAt < DateTime.UtcNow) return BadRequest("This link has expired.");

        if (await _db.Users.AnyAsync(u => u.Email == entity.Email, ct))
        {
            entity.ConsumedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return BadRequest("An account with this email already exists.");
        }

        var plan = (req.Plan ?? "trial").Trim().ToLowerInvariant();
        var (subscriptionType, subscriptionExpiration) = plan switch
        {
            "unlimited" =>
                ("Unlimited", (DateOnly?)DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30))),
            "comics" =>
                ("Comics", (DateOnly?)DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30))),
            "tv" =>
                ("TV", (DateOnly?)DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30))),
            _ =>
                ("Trial", (DateOnly?)DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7))),
        };

        var username = await GenerateUniqueUsername(entity.Email, ct);
        var user = new User
        {
            Email = entity.Email,
            Username = username,
            Password = _hasher.Hash(req.Password!),
            Role = "USER",
            SubscriptionType = subscriptionType,
            SubscriptionExpiration = subscriptionExpiration
        };
        _db.Users.Add(user);

        entity.ConsumedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // Create the root profile inline at signup so concurrent GET /api/profiles
        // calls (e.g. from React StrictMode double-render) don't race-create two.
        EnsureRootProfile(user);
        await _db.SaveChangesAsync(ct);

        return Ok(BuildResponse(user));
    }

    private async Task<string> GenerateUniqueUsername(string email, CancellationToken ct)
    {
        var baseUsername = email.Split('@')[0];
        var candidate = baseUsername;
        var suffix = 1;
        while (await _db.Users.AnyAsync(u => u.Username == candidate, ct))
        {
            candidate = $"{baseUsername}{suffix++}";
        }
        return candidate;
    }

    /// <summary>
    /// Attach a root profile to a freshly-created user. Called at signup time
    /// so the GET /api/profiles endpoint never has to race-create one.
    /// </summary>
    private void EnsureRootProfile(User user)
    {
        var name = string.IsNullOrWhiteSpace(user.FirstName) ? user.Username : user.FirstName!;
        _db.Profiles.Add(new Entities.Profile
        {
            UserId = user.Id,
            Name = name,
            AvatarColor = "#E50914",
            IsRoot = true,
            IsKids = false,
        });
    }

    private AuthResponse BuildResponse(User user) => new()
    {
        Token = _jwt.GenerateToken(user),
        UserId = user.Id,
        Username = user.Username,
        Email = user.Email,
        Role = string.IsNullOrWhiteSpace(user.Role) ? "USER" : user.Role,
        FirstName = user.FirstName,
        LastName = user.LastName,
        DateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
        SubscriptionType = user.SubscriptionType,
        SubscriptionExpiration = user.SubscriptionExpiration?.ToString("yyyy-MM-dd"),
        CreatedAt = user.CreatedAt == default ? null : user.CreatedAt.ToString("o"),
        UpdatedAt = user.UpdatedAt == default ? null : user.UpdatedAt.ToString("o")
    };

    private static string BuildSignupEmail(string link) => $@"
<!doctype html>
<html lang=""en"">
<head>
  <meta charset=""utf-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1"" />
  <title>You're almost there!</title>
</head>
<body style=""margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#f5f5f5;"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#0a0a0a;padding:40px 16px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" width=""560"" cellpadding=""0"" cellspacing=""0"" style=""max-width:560px;background:#141414;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;"">
          <tr>
            <td style=""padding:32px 32px 8px 32px;"">
              <div style=""font-size:32px;font-weight:900;letter-spacing:-1px;color:#E50914;"">BAZINGA</div>
            </td>
          </tr>
          <tr>
            <td style=""padding:8px 32px 0 32px;"">
              <h1 style=""font-size:28px;line-height:1.2;margin:0 0 16px 0;color:#ffffff;font-weight:900;"">Let's create your account</h1>
              <p style=""margin:0 0 12px 0;color:#cfcfcf;"">Hey there,</p>
              <p style=""margin:0 0 24px 0;color:#cfcfcf;font-size:15px;line-height:1.55;"">
                We're excited to have you. Tap the link below to finish creating your Bazinga account and dive into thousands of comics and series.
              </p>
              <p style=""text-align:center;margin:24px 0;"">
                <a href=""{link}"" style=""display:inline-block;background:#E50914;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:6px;font-size:15px;letter-spacing:0.5px;"">Create your account</a>
              </p>
              <p style=""margin:0 0 24px 0;color:#888;font-size:12px;text-align:center;"">This link will expire in {SignupTokenLifetimeMinutes} minutes.</p>
            </td>
          </tr>
          <tr>
            <td style=""padding:8px 32px 32px 32px;"">
              <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""border-top:1px solid #2a2a2a;padding-top:16px;"">
                <tr>
                  <td style=""padding:10px 0;color:#cfcfcf;font-size:14px;"">
                    <strong style=""display:block;color:#ffffff;"">No password needed yet</strong>
                    Set your password on the next page.
                  </td>
                </tr>
                <tr>
                  <td style=""padding:10px 0;color:#cfcfcf;font-size:14px;"">
                    <strong style=""display:block;color:#ffffff;"">Cancel anytime</strong>
                    Change or cancel your plan whenever you like.
                  </td>
                </tr>
                <tr>
                  <td style=""padding:10px 0;color:#cfcfcf;font-size:14px;"">
                    <strong style=""display:block;color:#ffffff;"">Unlimited entertainment</strong>
                    Comics, animated series, anime and live action — all in one place.
                  </td>
                </tr>
              </table>
              <p style=""margin:24px 0 0 0;color:#888;font-size:12px;"">Didn't ask to create a Bazinga account? You can safely ignore this email — the link will expire on its own.</p>
            </td>
          </tr>
        </table>
        <p style=""margin:16px 0 0 0;color:#666;font-size:11px;"">© 2026 BAZINGA. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>";
}
