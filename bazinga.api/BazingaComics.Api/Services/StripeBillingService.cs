using System.Diagnostics;
using Microsoft.Extensions.Options;
using Stripe;

namespace BazingaComics.Api.Services;

public class StripeBillingService : IBillingService
{
    private readonly StripeOptions _options;
    private readonly ILogger<StripeBillingService> _logger;
    private readonly IStripeClient? _stripeClient;

    public StripeBillingService(IOptions<StripeOptions> options, ILogger<StripeBillingService> logger)
    {
        _options = options.Value;
        _logger = logger;

        if (IsConfigured)
        {
            // Give Stripe a tight timeout and a single retry so a blocked
            // outbound connection fails fast instead of hanging the request.
            var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(12) };
            _stripeClient = new StripeClient(
                _options.SecretKey,
                httpClient: new SystemNetHttpClient(httpClient, maxNetworkRetries: 1));
        }
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_options.SecretKey)
        && !string.IsNullOrWhiteSpace(_options.PublishableKey);

    public string PublishableKey => _options.PublishableKey;

    public async Task<SetupIntentResult> CreateSetupIntentAsync(string email, CancellationToken ct = default)
    {
        if (!IsConfigured || _stripeClient is null)
        {
            throw new InvalidOperationException(
                "Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.");
        }

        var sw = Stopwatch.StartNew();
        _logger.LogInformation("Stripe: creating customer for {Email}…", email);

        var customerService = new CustomerService(_stripeClient);
        var customer = await customerService.CreateAsync(
            new CustomerCreateOptions { Email = email },
            cancellationToken: ct);

        _logger.LogInformation("Stripe: customer {CustomerId} created in {Ms}ms, creating SetupIntent…",
            customer.Id, sw.ElapsedMilliseconds);

        var setupIntentService = new SetupIntentService(_stripeClient);
        var intent = await setupIntentService.CreateAsync(
            new SetupIntentCreateOptions
            {
                Customer = customer.Id,
                PaymentMethodTypes = new List<string> { "card" },
                Usage = "off_session",
            },
            cancellationToken: ct);

        _logger.LogInformation("Stripe: SetupIntent {IntentId} ready in {Ms}ms total",
            intent.Id, sw.ElapsedMilliseconds);

        return new SetupIntentResult(intent.ClientSecret, customer.Id);
    }
}
