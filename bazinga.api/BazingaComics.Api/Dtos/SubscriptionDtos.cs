namespace BazingaComics.Api.Dtos;

public class SubscriptionRequest
{
    public string? SubscriptionType { get; set; }
    public string? BillingCycle { get; set; }
}

public class SubscriptionResponse
{
    public string? SubscriptionType { get; set; }
    public string? SubscriptionExpiration { get; set; }
}
