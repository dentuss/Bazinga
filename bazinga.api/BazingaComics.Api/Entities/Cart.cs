using System.Text.Json.Serialization;

namespace BazingaComics.Api.Entities;

public class Cart
{
    public long Id { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    public User? User { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    [JsonIgnore]
    public List<CartItem> Items { get; set; } = new();
}
