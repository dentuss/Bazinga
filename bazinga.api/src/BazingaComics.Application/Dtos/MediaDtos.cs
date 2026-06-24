namespace BazingaComics.Application.Dtos;

/// <summary>
/// Read-model for a single playable catalogue entry — the shape the SPA
/// consumes from <c>/api/media</c>. Genres and badges arrive as already-parsed
/// arrays so the client never has to touch the underlying JSON columns.
/// </summary>
public class MediaItemDto
{
    public long Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Kind { get; set; } = "trailer";

    public string Title { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? Description { get; set; }

    public int? Year { get; set; }
    public string? Rating { get; set; }

    public List<string> Genres { get; set; } = new();
    public List<string> Badges { get; set; } = new();

    public string? BackdropImage { get; set; }
    public string? PosterImage { get; set; }
    public string? TrailerUrl { get; set; }

    public bool IsFeatured { get; set; }
    public int SortOrder { get; set; }

    /// <summary>Populated on the detail endpoint, empty on list endpoints.</summary>
    public List<MediaSeasonDto> Seasons { get; set; } = new();
}

public class MediaSeasonDto
{
    public long Id { get; set; }
    public int Number { get; set; }
    public string? Title { get; set; }
    public int SortOrder { get; set; }
    public List<MediaEpisodeDto> Episodes { get; set; } = new();
}

public class MediaEpisodeDto
{
    public long Id { get; set; }
    public int Number { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? RuntimeMinutes { get; set; }
    public string VideoUrl { get; set; } = string.Empty;
    public string? Thumbnail { get; set; }
}

// ---------------------------------------------------------------------------
// Admin write models — what the admin form sends back to /api/admin/media.
// Slug is omitted on create (server generates from title if blank), required
// to be unique on update. Seasons + episodes are sent as a full nested tree
// and the server replaces the children atomically.
// ---------------------------------------------------------------------------

public class MediaItemUpsertRequest
{
    public string? Slug { get; set; }
    public string Kind { get; set; } = "trailer";

    public string Title { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? Description { get; set; }

    public int? Year { get; set; }
    public string? Rating { get; set; }

    public List<string>? Genres { get; set; }
    public List<string>? Badges { get; set; }

    public string? BackdropImage { get; set; }
    public string? PosterImage { get; set; }
    public string? TrailerUrl { get; set; }

    public bool IsFeatured { get; set; }
    public int SortOrder { get; set; }

    public List<MediaSeasonUpsertRequest>? Seasons { get; set; }
}

public class MediaSeasonUpsertRequest
{
    public int Number { get; set; }
    public string? Title { get; set; }
    public int SortOrder { get; set; }
    public List<MediaEpisodeUpsertRequest> Episodes { get; set; } = new();
}

public class MediaEpisodeUpsertRequest
{
    public int Number { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? RuntimeMinutes { get; set; }
    public string VideoUrl { get; set; } = string.Empty;
    public string? Thumbnail { get; set; }
}
