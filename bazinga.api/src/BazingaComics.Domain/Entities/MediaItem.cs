using System.Text.Json.Serialization;

namespace BazingaComics.Domain.Entities;

/// <summary>
/// Discriminator for a media catalogue entry. Drives which surfaces it can
/// appear on and how Play behaves:
///   * <see cref="Trailer"/> — short promo clip, no seasons, played by
///     <see cref="MediaItem.TrailerUrl"/>.
///   * <see cref="Show"/>    — multi-episode live-action / animated series;
///     prepends the Superhero Shows rail.
///   * <see cref="Anime"/>   — multi-episode anime; prepends the Anime
///     Universe rail. Same shape as Show but rendered in a different
///     section so anime cards live next to anime.
///   * <see cref="Movie"/>   — modelled as a single season with one
///     "episode" row holding the movie file URL.
/// </summary>
public enum MediaKind
{
    Trailer = 0,
    Show = 1,
    Movie = 2,
    Anime = 3,
}

/// <summary>
/// A playable catalogue entry — replaces the static
/// <c>data/episodeCatalogue.ts</c> + <c>data/trailers.ts</c> on the client and
/// the files that used to live under <c>public/Series_films</c>. Everything
/// the TV surfaces need to render a card, a detail modal, the hero reel and
/// the Watch page is reachable from this row.
/// </summary>
public class MediaItem
{
    public long Id { get; set; }

    /// <summary>URL-safe identifier used by the Watch route
    /// (<c>/bazinga-tv/watch/{slug}</c>) and by all admin look-ups.</summary>
    public string Slug { get; set; } = string.Empty;

    public MediaKind Kind { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? Description { get; set; }

    public int? Year { get; set; }

    /// <summary>Free-form age/content rating string (e.g. "TV-MA", "PG-13").</summary>
    public string? Rating { get; set; }

    /// <summary>JSON array of genre strings, e.g. ["Action","Dark Fantasy"].</summary>
    public string GenresJson { get; set; } = "[]";

    /// <summary>JSON array of badge strings shown on the hero card
    /// (e.g. ["FINAL SEASON","TOP 10 TODAY"]).</summary>
    public string BadgesJson { get; set; } = "[]";

    /// <summary>Wide image used for the hero / modal backdrop.</summary>
    public string? BackdropImage { get; set; }

    /// <summary>Tall poster used for rail cards.</summary>
    public string? PosterImage { get; set; }

    /// <summary>Short clip used by the TV hero reel and the trailer modal.
    /// Independent of any episode video; can also be empty.</summary>
    public string? TrailerUrl { get; set; }

    /// <summary>Promoted into the rotating TV hero when true.</summary>
    public bool IsFeatured { get; set; }

    /// <summary>Lower numbers sort first on rails and in the hero.</summary>
    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    [JsonIgnore]
    public ICollection<MediaSeason> Seasons { get; set; } = new List<MediaSeason>();
}
