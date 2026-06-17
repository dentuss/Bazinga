namespace BazingaComics.Api.Dtos;

/// <summary>
/// A comic issue / collection surfaced from the comics metadata provider
/// (currently Open Library — free, no-auth, real covers + descriptions for
/// Marvel/DC/indie). Publisher-neutral on purpose so the source can be swapped
/// or supplemented (ComicVine, Metron…) without touching the controller/client.
/// </summary>
public class ComicMetaDto
{
    /// <summary>Open Library work number — the N in OL{N}W.</summary>
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    /// <summary>Large cover (covers.openlibrary.org …-L.jpg).</summary>
    public string? Image { get; set; }
    /// <summary>Medium cover (…-M.jpg) for rails / small cards.</summary>
    public string? Thumbnail { get; set; }
    /// <summary>Populated by the detail endpoint; null in list responses.</summary>
    public string? Description { get; set; }
    public string? Series { get; set; }
    public int? Year { get; set; }
    public List<string> Creators { get; set; } = new();
    public List<string> Genres { get; set; } = new();
}

public class ComicsMetaPagedResponse
{
    public List<ComicMetaDto> Data { get; set; } = new();
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    /// <summary>Always true for the no-auth provider; kept so the client can
    /// fall back to placeholders when the upstream is unreachable (empty data).</summary>
    public bool Configured { get; set; } = true;
}
