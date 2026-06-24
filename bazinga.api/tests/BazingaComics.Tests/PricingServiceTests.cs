using BazingaComics.Application.Services;
using BazingaComics.Domain.Entities;
using Xunit;

namespace BazingaComics.Tests;

/// <summary>
/// Covers every branch of the subscription-aware pricing rules: each tier, the
/// active/expired gate, digital vs physical, and the null-price guard.
/// </summary>
public class PricingServiceTests
{
    private static Comic Comic(decimal? price) => new() { Id = 1, Title = "X", Price = price };

    private static User User(string? sub, DateOnly? expiration = null) =>
        new() { SubscriptionType = sub, SubscriptionExpiration = expiration };

    private static readonly DateOnly Future = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
    private static readonly DateOnly Past = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));

    [Theory]
    [InlineData("Free")]
    [InlineData(null)]
    [InlineData("")]
    public void Inactive_Subscriptions_Pay_Full_Price(string? sub)
    {
        var user = User(sub);
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.ORIGINAL, user));
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
    }

    [Theory]
    [InlineData("Unlimited")]
    [InlineData("Trial")]
    [InlineData("unlimited")] // case-insensitive
    public void Unlimited_And_Trial_Free_Digital_Half_Physical(string sub)
    {
        var user = User(sub);
        Assert.Equal(0m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
        Assert.Equal(5m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.ORIGINAL, user));
    }

    [Fact]
    public void Comics_Plan_Free_Digital_Full_Physical()
    {
        var user = User("Comics");
        Assert.Equal(0m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.ORIGINAL, user));
    }

    [Fact]
    public void Premium_Plan_25_Percent_Off_Digital_Full_Physical()
    {
        var user = User("Premium");
        Assert.Equal(7.5m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.ORIGINAL, user));
    }

    [Fact]
    public void Tv_Plan_Gives_No_Comic_Discount()
    {
        var user = User("TV");
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.ORIGINAL, user));
    }

    [Fact]
    public void Expired_Subscription_Falls_Back_To_Full_Price()
    {
        var user = User("Unlimited", Past);
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.ORIGINAL, user));
    }

    [Fact]
    public void Future_Expiration_Keeps_Discounts_Active()
    {
        var user = User("Unlimited", Future);
        Assert.Equal(0m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
    }

    [Fact]
    public void Null_Expiration_Is_Treated_As_Perpetually_Active()
    {
        var user = User("Comics", expiration: null);
        Assert.Equal(0m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
    }

    [Fact]
    public void Null_Price_Is_Free()
    {
        Assert.Equal(0m, PricingService.CalculateUnitPrice(Comic(null), PurchaseType.ORIGINAL, User("Free")));
        Assert.Equal(0m, PricingService.CalculateUnitPrice(Comic(null), PurchaseType.DIGITAL, User("Unlimited")));
    }
}
