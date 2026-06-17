namespace BazingaComics.Api.Dtos;

/// <summary>
/// A single Marvel issue as exposed to the client. Mapped from
/// <c>data.results[]</c> of the Marvel comics endpoint, with the thumbnail
/// expanded into the two cover sizes we actually use on the site.
/// </summary>
public class MarvelComicDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? IssueNumber { get; set; }
    public string? Description { get; set; }
    /// <summary>portrait_uncanny (300×450) — perfect for catalogue tiles.</summary>
    public string? Image { get; set; }
    /// <summary>portrait_incredible (216×324) — used in rails / small cards.</summary>
    public string? Thumbnail { get; set; }
    public string? Series { get; set; }
    public string? Format { get; set; }
    public int? PageCount { get; set; }
    public string? OnSaleDate { get; set; }
    public decimal? PrintPrice { get; set; }
    public List<string> Creators { get; set; } = new();
    public List<string> Characters { get; set; } = new();
    public string? DetailUrl { get; set; }
}

public class MarvelPagedResponse
{
    public List<MarvelComicDto> Data { get; set; } = new();
    public int Offset { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public bool Configured { get; set; }
}

public class MarvelStatusResponse
{
    public bool Configured { get; set; }
}
