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
    public string? Phone { get; set; }
    public string? SubscriptionType { get; set; }
    public string? SubscriptionExpiration { get; set; }
    public bool TwoFactorEnabled { get; set; }
    /// <summary>Set when first-factor succeeded but a TOTP code is still required.
    /// In that case <see cref="Token"/> is empty and <see cref="ChallengeToken"/> is set.</summary>
    public bool TwoFactorRequired { get; set; }
    public string? ChallengeToken { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
}

public class TwoFactorSetupResponse
{
    public string Secret { get; set; } = string.Empty;
    public string OtpauthUri { get; set; } = string.Empty;
}

public class TwoFactorCodeRequest
{
    public string? Code { get; set; }
}

public class TwoFactorLoginVerifyRequest
{
    public string? ChallengeToken { get; set; }
    public string? Code { get; set; }
}

public class SigninStartRequest
{
    public string? Email { get; set; }
}

public class SigninVerifyRequest
{
    public string? Token { get; set; }
}

public class ForgotPasswordRequest
{
    public string? Email { get; set; }
}

public class ResetPasswordRequest
{
    public string? Token { get; set; }
    public string? NewPassword { get; set; }
}

public class UpdateAccountRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Phone { get; set; }
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
    /// <summary>"trial", "comics", "tv" or "unlimited"</summary>
    public string? Plan { get; set; }
    /// <summary>Stripe payment_method id (pm_…), optional when running with mock fallback.</summary>
    public string? PaymentMethodId { get; set; }
}

public class BillingIntentRequest
{
    public string? Token { get; set; }
}

public class BillingIntentResponse
{
    public bool StripeConfigured { get; set; }
    public string? ClientSecret { get; set; }
    public string? PublishableKey { get; set; }
    public string? CustomerId { get; set; }
}
