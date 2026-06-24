using System.Text.Json.Serialization;

namespace BazingaComics.Domain.Entities;

/// <summary>
/// A single playable episode (or, for movies, the only episode) inside a
/// <see cref="MediaSeason"/>. Video lives at an external <see cref="VideoUrl"/>
/// — S3, CloudFront, YouTube embed, anywhere reachable from the browser — so
/// nothing ships in <c>public/</c> any more.
/// </summary>
public class MediaEpisode
{
    public long Id { get; set; }

    public long SeasonId { get; set; }

    [JsonIgnore]
    public MediaSeason? Season { get; set; }

    /// <summary>1-based number within the season; not globally unique.</summary>
    public int Number { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Runtime hint shown in the picker chip; not authoritative.</summary>
    public int? RuntimeMinutes { get; set; }

    /// <summary>Externally hosted video URL. Required for the player to work.</summary>
    public string VideoUrl { get; set; } = string.Empty;

    /// <summary>Optional thumbnail; falls back to the parent's backdrop.</summary>
    public string? Thumbnail { get; set; }
}
