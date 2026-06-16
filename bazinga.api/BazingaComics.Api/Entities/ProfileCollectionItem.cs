using System.Text.Json.Serialization;

namespace BazingaComics.Api.Entities;

/// <summary>
/// A single saved item in a profile's collection. One table backs both the
/// Comics "Library" (comics + manga) and the BazingaTV "My List" (anime +
/// shows), discriminated by <see cref="Collection"/> and <see cref="Kind"/>.
///
/// Unlike <see cref="LibraryItem"/>/<see cref="WishlistItem"/> — which FK into
/// the local <c>comics</c> table — this entity stores a denormalised snapshot
/// (title/image/subtitle + a JSON payload) keyed by an opaque
/// <see cref="ContentId"/>. That lets it hold items sourced from external
/// metadata providers (Jikan manga/anime, TVMaze shows) that never live in our
/// database, and it is scoped per-profile rather than per-user.
/// </summary>
public class ProfileCollectionItem
{
    public long Id { get; set; }

    public long ProfileId { get; set; }

    [JsonIgnore]
    public Profile? Profile { get; set; }

    /// <summary>"library" (comics side) or "mylist" (TV side).</summary>
    public string Collection { get; set; } = "library";

    /// <summary>"comic" | "manga" | "anime" | "show".</summary>
    public string Kind { get; set; } = "comic";

    /// <summary>Provider id / slug as a string (e.g. comic id, MAL id, TVMaze id).</summary>
    public string ContentId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Image { get; set; }

    public string? Subtitle { get; set; }

    /// <summary>Full item JSON so the client can re-render the card and reopen
    /// its detail modal without re-fetching the upstream provider.</summary>
    public string? PayloadJson { get; set; }

    public DateTime AddedAt { get; set; }
}
