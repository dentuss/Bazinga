using BazingaComics.Application.Common.Interfaces;
using BazingaComics.Application.Dtos;
using BazingaComics.Domain.Entities;
using BazingaComics.Web.Security;
using BazingaComics.Application.Security;
using BazingaComics.Application.Options;
using BazingaComics.Application.Abstractions;
using BazingaComics.Application.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BazingaComics.Web.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const int SignupTokenLifetimeMinutes = 15;

    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtService _jwt;
    private readonly IEmailSender _emailSender;
    private readonly EmailOptions _emailOptions;
    private readonly IBillingService _billing;

    public AuthController(
        IAppDbContext db,
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

        if (RequiresTwoFactor(user))
        {
            return Ok(await ChallengeResponseAsync(user, ct));
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
        _db.Profiles.Add(new Profile
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
        Phone = user.Phone,
        SubscriptionType = user.SubscriptionType,
        SubscriptionExpiration = user.SubscriptionExpiration?.ToString("yyyy-MM-dd"),
        TwoFactorEnabled = user.TwoFactorEnabled,
        CreatedAt = user.CreatedAt == default ? null : user.CreatedAt.ToString("o"),
        UpdatedAt = user.UpdatedAt == default ? null : user.UpdatedAt.ToString("o")
    };

    // -----------------------------------------------------------------------
    // Two-factor authentication (TOTP — Google Authenticator etc.)
    // -----------------------------------------------------------------------

    private const int TwoFactorChallengeLifetimeMinutes = 5;
    private const string TwoFactorIssuer = "Bazinga";

    private bool RequiresTwoFactor(User user) =>
        user.TwoFactorEnabled && !string.IsNullOrEmpty(user.TwoFactorSecret);

    private async Task<AuthResponse> ChallengeResponseAsync(User user, CancellationToken ct)
    {
        // Invalidate older live challenges, then mint a fresh one.
        await _db.TwoFactorChallenges
            .Where(c => c.UserId == user.Id && c.ConsumedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.ConsumedAt, DateTime.UtcNow), ct);

        var rawToken = SignupTokens.Generate();
        _db.TwoFactorChallenges.Add(new TwoFactorChallenge
        {
            UserId = user.Id,
            TokenHash = SignupTokens.Hash(rawToken),
            ExpiresAt = DateTime.UtcNow.AddMinutes(TwoFactorChallengeLifetimeMinutes),
        });
        await _db.SaveChangesAsync(ct);

        return new AuthResponse
        {
            TwoFactorRequired = true,
            ChallengeToken = rawToken,
            TwoFactorEnabled = true,
            Email = user.Email,
        };
    }

    /// <summary>Begin enrollment: mint a pending secret and return the otpauth URI for the QR code.</summary>
    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpPost("2fa/setup")]
    public async Task<ActionResult<TwoFactorSetupResponse>> TwoFactorSetup(CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();
        if (user.TwoFactorEnabled)
        {
            return BadRequest("Two-factor authentication is already enabled. Disable it first to re-configure.");
        }

        var secret = Totp.GenerateSecret();
        user.TwoFactorSecret = secret; // pending until /2fa/confirm
        await _db.SaveChangesAsync(ct);

        return Ok(new TwoFactorSetupResponse
        {
            Secret = secret,
            OtpauthUri = Totp.BuildOtpAuthUri(TwoFactorIssuer, user.Email, secret),
        });
    }

    /// <summary>Confirm the first code from the authenticator and switch 2FA on.</summary>
    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpPost("2fa/confirm")]
    public async Task<ActionResult<AuthResponse>> TwoFactorConfirm([FromBody] TwoFactorCodeRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();
        if (string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            return BadRequest("Start two-factor setup first.");
        }
        if (!Totp.Verify(user.TwoFactorSecret, req.Code))
        {
            return BadRequest("Incorrect code. Check your device's clock and try again.");
        }

        user.TwoFactorEnabled = true;
        await _db.SaveChangesAsync(ct);
        return Ok(BuildResponse(user));
    }

    /// <summary>Turn 2FA off — requires a current valid code.</summary>
    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpPost("2fa/disable")]
    public async Task<ActionResult<AuthResponse>> TwoFactorDisable([FromBody] TwoFactorCodeRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();
        if (!user.TwoFactorEnabled) return Ok(BuildResponse(user));

        if (!Totp.Verify(user.TwoFactorSecret, req.Code))
        {
            return BadRequest("Incorrect code.");
        }

        user.TwoFactorEnabled = false;
        user.TwoFactorSecret = null;
        await _db.SaveChangesAsync(ct);
        return Ok(BuildResponse(user));
    }

    /// <summary>Exchange a 2FA challenge + TOTP code for a real session.</summary>
    [HttpPost("2fa/login-verify")]
    public async Task<ActionResult<AuthResponse>> TwoFactorLoginVerify([FromBody] TwoFactorLoginVerifyRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.ChallengeToken)) return BadRequest("Challenge token is required.");
        if (string.IsNullOrWhiteSpace(req.Code)) return BadRequest("Code is required.");

        var hash = SignupTokens.Hash(req.ChallengeToken!);
        var challenge = await _db.TwoFactorChallenges.FirstOrDefaultAsync(c => c.TokenHash == hash, ct);
        if (challenge is null || challenge.ConsumedAt is not null || challenge.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest("This verification step has expired. Please sign in again.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == challenge.UserId, ct);
        if (user is null || string.IsNullOrEmpty(user.TwoFactorSecret)) return BadRequest("Account not found.");

        // Leave the challenge live on a wrong code so the user can retry until it expires.
        if (!Totp.Verify(user.TwoFactorSecret, req.Code))
        {
            return BadRequest("Incorrect code. Try again.");
        }

        challenge.ConsumedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(BuildResponse(user));
    }

    // -----------------------------------------------------------------------
    // Passwordless sign-in (magic link)
    // -----------------------------------------------------------------------

    private const int SigninTokenLifetimeMinutes = 15;
    private const int PasswordResetTokenLifetimeMinutes = 30;

    /// <summary>
    /// Always returns 204 — never confirms whether the email exists. If the
    /// address matches a real account we email a one-shot sign-in link.
    /// </summary>
    [HttpPost("signin/start")]
    public async Task<IActionResult> SigninStart([FromBody] SigninStartRequest req, CancellationToken ct)
    {
        var email = req.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email)) return BadRequest("Email is required.");

        var exists = await _db.Users.AnyAsync(u => u.Email == email, ct);
        if (!exists)
        {
            // Don't leak account existence; pretend we sent it.
            return NoContent();
        }

        await _db.SigninTokens
            .Where(t => t.Email == email && t.ConsumedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.ConsumedAt, DateTime.UtcNow), ct);

        var rawToken = SignupTokens.Generate();
        _db.SigninTokens.Add(new SigninToken
        {
            Email = email!,
            TokenHash = SignupTokens.Hash(rawToken),
            ExpiresAt = DateTime.UtcNow.AddMinutes(SigninTokenLifetimeMinutes),
        });
        await _db.SaveChangesAsync(ct);

        var baseUrl = _emailOptions.PublicBaseUrl.TrimEnd('/');
        var link = $"{baseUrl}/signin/verify?token={Uri.EscapeDataString(rawToken)}";
        await _emailSender.SendAsync(email!, "Your Bazinga sign-in link", BuildSigninEmail(link), ct);
        return NoContent();
    }

    /// <summary>
    /// Burns the magic-link token and, if valid, returns a JWT — i.e. the
    /// caller is logged in.
    /// </summary>
    [HttpPost("signin/verify")]
    public async Task<ActionResult<AuthResponse>> SigninVerify([FromBody] SigninVerifyRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token)) return BadRequest("Token is required.");

        var hash = SignupTokens.Hash(req.Token!);
        var entity = await _db.SigninTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (entity is null) return BadRequest("Invalid sign-in link.");
        if (entity.ConsumedAt is not null) return BadRequest("This link has already been used.");
        if (entity.ExpiresAt < DateTime.UtcNow) return BadRequest("This link has expired.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == entity.Email, ct);
        if (user is null) return BadRequest("Account not found.");

        entity.ConsumedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        if (RequiresTwoFactor(user))
        {
            return Ok(await ChallengeResponseAsync(user, ct));
        }

        return Ok(BuildResponse(user));
    }

    // -----------------------------------------------------------------------
    // Password reset
    // -----------------------------------------------------------------------

    /// <summary>
    /// Always returns 204 to avoid leaking account existence. When the email
    /// matches a real account we issue a one-shot reset token and email it.
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        var email = req.Email?.Trim();
        if (string.IsNullOrWhiteSpace(email)) return BadRequest("Email is required.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null) return NoContent();

        await _db.PasswordResetTokens
            .Where(t => t.Email == email && t.ConsumedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.ConsumedAt, DateTime.UtcNow), ct);

        var rawToken = SignupTokens.Generate();
        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            Email = email!,
            TokenHash = SignupTokens.Hash(rawToken),
            ExpiresAt = DateTime.UtcNow.AddMinutes(PasswordResetTokenLifetimeMinutes),
        });
        await _db.SaveChangesAsync(ct);

        var baseUrl = _emailOptions.PublicBaseUrl.TrimEnd('/');
        var link = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";
        await _emailSender.SendAsync(email!, "Reset your Bazinga password", BuildResetPasswordEmail(link), ct);
        return NoContent();
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token)) return BadRequest("Token is required.");
        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword!.Length < 6)
        {
            return BadRequest("Password must be at least 6 characters.");
        }

        var hash = SignupTokens.Hash(req.Token!);
        var entity = await _db.PasswordResetTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (entity is null) return BadRequest("Invalid reset link.");
        if (entity.ConsumedAt is not null) return BadRequest("This link has already been used.");
        if (entity.ExpiresAt < DateTime.UtcNow) return BadRequest("This link has expired.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == entity.Email, ct);
        if (user is null) return BadRequest("Account not found.");

        user.Password = _hasher.Hash(req.NewPassword!);
        entity.ConsumedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    // -----------------------------------------------------------------------
    // Self-service account update (used for phone, names, DOB)
    // -----------------------------------------------------------------------

    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpPut("me")]
    public async Task<ActionResult<AuthResponse>> UpdateMe([FromBody] UpdateAccountRequest req, CancellationToken ct)
    {
        var user = await CurrentUser.GetAsync(User, _db, ct);
        if (user is null) return Unauthorized();

        if (req.FirstName is not null) user.FirstName = NullIfBlank(req.FirstName);
        if (req.LastName is not null) user.LastName = NullIfBlank(req.LastName);
        if (req.Phone is not null) user.Phone = NullIfBlank(req.Phone);
        if (req.DateOfBirth is not null)
        {
            if (string.IsNullOrWhiteSpace(req.DateOfBirth))
            {
                user.DateOfBirth = null;
            }
            else if (DateOnly.TryParse(req.DateOfBirth, out var dob))
            {
                user.DateOfBirth = dob;
            }
            else
            {
                return BadRequest("Invalid date of birth.");
            }
        }

        await _db.SaveChangesAsync(ct);
        return Ok(BuildResponse(user));
    }

    private static string? NullIfBlank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string BuildSigninEmail(string link) => $@"
<!doctype html>
<html lang=""en"">
<head>
  <meta charset=""utf-8"" />
  <title>Your Bazinga sign-in link</title>
</head>
<body style=""margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#f5f5f5;"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#0a0a0a;padding:40px 16px;"">
    <tr><td align=""center"">
      <table role=""presentation"" width=""560"" cellpadding=""0"" cellspacing=""0"" style=""max-width:560px;background:#141414;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;"">
        <tr><td style=""padding:32px;"">
          <div style=""font-size:32px;font-weight:900;letter-spacing:-1px;color:#E50914;"">BAZINGA</div>
          <h1 style=""font-size:26px;line-height:1.2;margin:16px 0 12px 0;color:#ffffff;font-weight:900;"">Sign in to Bazinga</h1>
          <p style=""margin:0 0 16px 0;color:#cfcfcf;font-size:15px;line-height:1.55;"">
            Tap the button below to sign in. The link expires in {SigninTokenLifetimeMinutes} minutes and can only be used once.
          </p>
          <p style=""text-align:center;margin:24px 0;"">
            <a href=""{link}"" style=""display:inline-block;background:#E50914;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:6px;font-size:15px;letter-spacing:0.5px;"">Sign in to Bazinga</a>
          </p>
          <p style=""margin:24px 0 0 0;color:#888;font-size:12px;"">Didn't ask to sign in? You can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";

    private static string BuildResetPasswordEmail(string link) => $@"
<!doctype html>
<html lang=""en"">
<head>
  <meta charset=""utf-8"" />
  <title>Reset your Bazinga password</title>
</head>
<body style=""margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#f5f5f5;"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#0a0a0a;padding:40px 16px;"">
    <tr><td align=""center"">
      <table role=""presentation"" width=""560"" cellpadding=""0"" cellspacing=""0"" style=""max-width:560px;background:#141414;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;"">
        <tr><td style=""padding:32px;"">
          <div style=""font-size:32px;font-weight:900;letter-spacing:-1px;color:#E50914;"">BAZINGA</div>
          <h1 style=""font-size:26px;line-height:1.2;margin:16px 0 12px 0;color:#ffffff;font-weight:900;"">Reset your password</h1>
          <p style=""margin:0 0 16px 0;color:#cfcfcf;font-size:15px;line-height:1.55;"">
            Tap the button to choose a new password. The link expires in {PasswordResetTokenLifetimeMinutes} minutes and can only be used once.
          </p>
          <p style=""text-align:center;margin:24px 0;"">
            <a href=""{link}"" style=""display:inline-block;background:#E50914;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:6px;font-size:15px;letter-spacing:0.5px;"">Reset password</a>
          </p>
          <p style=""margin:24px 0 0 0;color:#888;font-size:12px;"">If you didn't request this you can safely ignore the email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";

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
