namespace BazingaComics.Application.Dtos;

public class CartItemRequest
{
    public long? CartItemId { get; set; }
    public long? ComicId { get; set; }
    public int Quantity { get; set; }
    public string? PurchaseType { get; set; }
}
