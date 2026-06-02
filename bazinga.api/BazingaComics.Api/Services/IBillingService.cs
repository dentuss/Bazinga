namespace BazingaComics.Api.Services;

public record SetupIntentResult(string ClientSecret, string CustomerId);

public interface IBillingService
{
    bool IsConfigured { get; }
    string PublishableKey { get; }
    Task<SetupIntentResult> CreateSetupIntentAsync(string email, CancellationToken ct = default);
}
