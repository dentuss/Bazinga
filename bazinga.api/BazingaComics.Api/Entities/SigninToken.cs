namespace BazingaComics.Api.Entities;

/// <summary>
/// Magic-link token issued for a passwordless sign-in. Mirrors
/// <see cref="SignupToken"/>: the raw link is hashed before storage, expires
/// quickly, and is single-use (<see cref="ConsumedAt"/> stamps consumption).
/// </summary>
public class SigninToken
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ConsumedAt { get; set; }
}
