using System.Text.Json.Serialization;

namespace BazingaComics.Api.Entities;

public class Order
{
    public long Id { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    public User? User { get; set; }

    public decimal? TotalAmount { get; set; }
    public string? Status { get; set; }
    public string? ShippingAddress { get; set; }
    public string? BillingAddress { get; set; }
    public DateTime OrderDate { get; set; }
}
