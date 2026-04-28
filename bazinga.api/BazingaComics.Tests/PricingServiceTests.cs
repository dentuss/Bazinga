using BazingaComics.Api.Entities;
using BazingaComics.Api.Services;
using Xunit;

namespace BazingaComics.Tests;

public class PricingServiceTests
{
    private static Comic Comic(decimal price) => new() { Id = 1, Title = "X", Price = price };

    [Fact]
    public void Free_User_Pays_Full_Price()
    {
        var user = new User { SubscriptionType = "Free" };
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.ORIGINAL, user));
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
    }

    [Fact]
    public void Premium_User_Gets_25_Percent_Off_Digital()
    {
        var user = new User { SubscriptionType = "Premium" };
        Assert.Equal(7.5m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
        Assert.Equal(10m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.ORIGINAL, user));
    }

    [Fact]
    public void Unlimited_User_Gets_Free_Digital_And_Half_Price_Original()
    {
        var user = new User { SubscriptionType = "Unlimited" };
        Assert.Equal(0m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.DIGITAL, user));
        Assert.Equal(5m, PricingService.CalculateUnitPrice(Comic(10m), PurchaseType.ORIGINAL, user));
    }
}
