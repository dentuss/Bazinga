namespace BazingaComics.Domain.Entities;

/// <summary>
/// One-shot token sent via "Forgot password?" so the user can choose a new
/// password without proving the current one. Same single-use / TTL discipline
/// as the signup and sign-in tokens.
/// </summary>
public class PasswordResetToken
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ConsumedAt { get; set; }
}
