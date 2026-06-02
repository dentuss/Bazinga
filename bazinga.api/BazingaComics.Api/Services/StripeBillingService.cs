using Microsoft.Extensions.Options;
using Stripe;

namespace BazingaComics.Api.Services;

public class StripeBillingService : IBillingService
{
    private readonly StripeOptions _options;
    private readonly ILogger<StripeBillingService> _logger;

    public StripeBillingService(IOptions<StripeOptions> options, ILogger<StripeBillingService> logger)
    {
        _options = options.Value;
        _logger = logger;
        if (IsConfigured)
        {
            StripeConfiguration.ApiKey = _options.SecretKey;
        }
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_options.SecretKey)
        && !string.IsNullOrWhiteSpace(_options.PublishableKey);

    public string PublishableKey => _options.PublishableKey;

    public async Task<SetupIntentResult> CreateSetupIntentAsync(string email, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException(
                "Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY env vars.");
        }

        var customerService = new CustomerService();
        var customer = await customerService.CreateAsync(
            new CustomerCreateOptions { Email = email },
            cancellationToken: ct);

        var setupIntentService = new SetupIntentService();
        var intent = await setupIntentService.CreateAsync(
            new SetupIntentCreateOptions
            {
                Customer = customer.Id,
                PaymentMethodTypes = new List<string> { "card" },
                Usage = "off_session",
            },
            cancellationToken: ct);

        _logger.LogInformation("Stripe SetupIntent created for {Email} (customer {CustomerId})",
            email, customer.Id);

        return new SetupIntentResult(intent.ClientSecret, customer.Id);
    }
}
