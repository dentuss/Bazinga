using BazingaComics.Application.Options;
using BazingaComics.Infrastructure.Billing;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace BazingaComics.Tests;

public class StripeBillingServiceTests
{
    private static StripeBillingService Service(string secret, string publishable) =>
        new(
            Options.Create(new StripeOptions { SecretKey = secret, PublishableKey = publishable }),
            NullLogger<StripeBillingService>.Instance);

    [Theory]
    [InlineData("", "")]
    [InlineData("sk_test_x", "")]
    [InlineData("", "pk_test_x")]
    [InlineData("  ", "  ")]
    public void IsConfigured_False_Unless_Both_Keys_Present(string secret, string publishable)
    {
        Assert.False(Service(secret, publishable).IsConfigured);
    }

    [Fact]
    public void IsConfigured_True_When_Both_Keys_Present()
    {
        Assert.True(Service("sk_test_x", "pk_test_x").IsConfigured);
    }

    [Fact]
    public void PublishableKey_Is_Exposed()
    {
        Assert.Equal("pk_test_abc", Service("sk_test_x", "pk_test_abc").PublishableKey);
    }

    [Fact]
    public async Task CreateSetupIntent_Throws_When_Unconfigured()
    {
        var svc = Service("", "");
        await Assert.ThrowsAsync<InvalidOperationException>(() => svc.CreateSetupIntentAsync("a@b.c"));
    }
}
