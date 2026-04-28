using System.Text.Json.Serialization;

namespace BazingaComics.Api.Entities;

public class Review
{
    public long Id { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    public User? User { get; set; }

    public long ComicId { get; set; }

    [JsonIgnore]
    public Comic? Comic { get; set; }

    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime ReviewDate { get; set; }
}
