using BazingaComics.Domain.Entities;

namespace BazingaComics.Application.Services;

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

        // Unlimited and Trial unlock digital reading entirely and halve physical.
        if (string.Equals(subscription, "Unlimited", StringComparison.OrdinalIgnoreCase)
            || string.Equals(subscription, "Trial", StringComparison.OrdinalIgnoreCase))
        {
            return purchaseType == PurchaseType.DIGITAL
                ? 0m
                : Math.Round(basePrice * 0.5m, 2);
        }

        // Dedicated Comics plan: digital reading free, physical at full price.
        if (string.Equals(subscription, "Comics", StringComparison.OrdinalIgnoreCase))
        {
            return purchaseType == PurchaseType.DIGITAL ? 0m : basePrice;
        }

        // Legacy Premium tier kept for backwards compatibility.
        if (string.Equals(subscription, "Premium", StringComparison.OrdinalIgnoreCase))
        {
            return purchaseType == PurchaseType.DIGITAL
                ? Math.Round(basePrice * 0.75m, 2)
                : basePrice;
        }

        // TV plan has no comic discount.
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
