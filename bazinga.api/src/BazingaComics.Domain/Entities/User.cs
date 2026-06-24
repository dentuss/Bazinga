using System.Text.Json.Serialization;

namespace BazingaComics.Domain.Entities;

public class User
{
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    [JsonIgnore]
    public string Password { get; set; } = string.Empty;

    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public string? SubscriptionType { get; set; } = "Free";
    public DateOnly? SubscriptionExpiration { get; set; }

    /// <summary>True once the user has confirmed a TOTP authenticator.</summary>
    public bool TwoFactorEnabled { get; set; }

    /// <summary>Base32 TOTP secret. Pending while setting up, active once enabled.</summary>
    [JsonIgnore]
    public string? TwoFactorSecret { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
