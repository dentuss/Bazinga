namespace BazingaComics.Api.Entities;

/// <summary>
/// Short-lived handle issued after the first authentication factor succeeds for
/// a 2FA-enabled account. The caller must exchange it (plus a valid TOTP code)
/// for a real session via /api/auth/2fa/login-verify. Single-use, 5-minute TTL,
/// hashed at rest — same discipline as the signup / sign-in tokens.
/// </summary>
public class TwoFactorChallenge
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ConsumedAt { get; set; }
}
