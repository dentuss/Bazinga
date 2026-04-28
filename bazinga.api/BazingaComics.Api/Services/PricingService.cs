using BazingaComics.Api.Entities;

namespace BazingaComics.Api.Services;

public static class PricingService
{
    public static decimal CalculateUnitPrice(Comic comic, PurchaseType purchaseType, User user)
    {
        var basePrice = comic.Price ?? 0m;
        var subscription = user.SubscriptionType?.Trim();
        var active = IsSubscriptionActive(user);

        if (!active)
        {
            return basePrice;
        }

        if (string.Equals(subscription, "Unlimited", StringComparison.OrdinalIgnoreCase))
        {
            return purchaseType == PurchaseType.DIGITAL
                ? 0m
                : Math.Round(basePrice * 0.5m, 2);
        }

        if (string.Equals(subscription, "Premium", StringComparison.OrdinalIgnoreCase))
        {
            return purchaseType == PurchaseType.DIGITAL
                ? Math.Round(basePrice * 0.75m, 2)
                : basePrice;
        }

        return basePrice;
    }

    private static bool IsSubscriptionActive(User user)
    {
        if (string.IsNullOrWhiteSpace(user.SubscriptionType) ||
            string.Equals(user.SubscriptionType, "Free", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (user.SubscriptionExpiration is null)
        {
            return true;
        }

        return user.SubscriptionExpiration.Value >= DateOnly.FromDateTime(DateTime.UtcNow);
    }
}
