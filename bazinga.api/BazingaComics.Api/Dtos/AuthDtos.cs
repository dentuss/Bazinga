using System.ComponentModel.DataAnnotations;

namespace BazingaComics.Api.Dtos;

public class AuthRequest
{
    public string? Email { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DateOfBirth { get; set; }
    public string? SubscriptionType { get; set; }
    public string? SubscriptionExpiration { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
}

public class EmailRequest
{
    public string? Email { get; set; }
}

public class EmailAvailabilityResponse
{
    public bool Available { get; set; }
}

public class SignupStartRequest
{
    public string? Email { get; set; }
    public bool OptOutMarketing { get; set; }
}

public class SignupVerifyResponse
{
    public bool Valid { get; set; }
    public string? Email { get; set; }
    /// <summary>"expired" | "consumed" | "invalid"</summary>
    public string? Reason { get; set; }
}

public class SignupCompleteRequest
{
    public string? Token { get; set; }
    public string? Password { get; set; }
    /// <summary>"subscribe" or "trial"</summary>
    public string? Plan { get; set; }
}
