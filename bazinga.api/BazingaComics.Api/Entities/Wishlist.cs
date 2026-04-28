using System.Text.Json.Serialization;

namespace BazingaComics.Api.Entities;

public class Wishlist
{
    public long Id { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    public User? User { get; set; }

    public DateTime CreatedAt { get; set; }

    [JsonIgnore]
    public List<WishlistItem> Items { get; set; } = new();
}
