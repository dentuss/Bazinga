using System.Text.Json.Serialization;

namespace BazingaComics.Domain.Entities;

public class LibraryItem
{
    public long Id { get; set; }

    public long LibraryId { get; set; }

    [JsonIgnore]
    public Library? Library { get; set; }

    public long ComicId { get; set; }
    public Comic? Comic { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
