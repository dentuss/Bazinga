using System.Text.Json.Serialization;

namespace BazingaComics.Domain.Entities;

public class WishlistItem
{
    public long Id { get; set; }

    public long WishlistId { get; set; }

    [JsonIgnore]
    public Wishlist? Wishlist { get; set; }

    public long ComicId { get; set; }
    public Comic? Comic { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
