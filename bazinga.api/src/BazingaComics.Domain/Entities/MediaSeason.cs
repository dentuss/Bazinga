using System.Text.Json.Serialization;

namespace BazingaComics.Domain.Entities;

/// <summary>
/// A grouping of episodes inside a <see cref="MediaItem"/>. Movies are stored
/// as a single season with one episode; trailers don't carry any seasons.
/// </summary>
public class MediaSeason
{
    public long Id { get; set; }

    public long MediaItemId { get; set; }

    [JsonIgnore]
    public MediaItem? MediaItem { get; set; }

    /// <summary>1-based season number as displayed in the picker.</summary>
    public int Number { get; set; }

    /// <summary>Optional display title (e.g. "Final Season"). When null the
    /// UI just shows "Season {Number}".</summary>
    public string? Title { get; set; }

    public int SortOrder { get; set; }

    [JsonIgnore]
    public ICollection<MediaEpisode> Episodes { get; set; } = new List<MediaEpisode>();
}
