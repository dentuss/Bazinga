using System.Text.Json.Serialization;

namespace BazingaComics.Domain.Entities;

public class CartItem
{
    public long Id { get; set; }

    public long CartId { get; set; }

    [JsonIgnore]
    public Cart? Cart { get; set; }

    public long ComicId { get; set; }
    public Comic? Comic { get; set; }

    public int Quantity { get; set; }
    public PurchaseType PurchaseType { get; set; } = PurchaseType.ORIGINAL;
    public decimal UnitPrice { get; set; }
}
