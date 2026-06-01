using System.Text.Json.Serialization;

namespace BazingaComics.Api.Entities;

public class Profile
{
    public long Id { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    public User? User { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public string AvatarColor { get; set; } = "#E50914";

    public string? AvatarIcon { get; set; }

    public bool IsRoot { get; set; }

    public bool IsKids { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
