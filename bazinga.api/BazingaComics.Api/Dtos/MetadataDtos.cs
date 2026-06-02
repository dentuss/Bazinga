namespace BazingaComics.Api.Dtos;

public class JikanPagination
{
    public int CurrentPage { get; set; }
    public int LastVisiblePage { get; set; }
    public bool HasNextPage { get; set; }
    public int? TotalItems { get; set; }
}

public class JikanPagedResponse<T>
{
    public List<T> Data { get; set; } = new();
    public JikanPagination Pagination { get; set; } = new();
}

public class AnimeDto
{
    public long MalId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleEnglish { get; set; }
    public string? Synopsis { get; set; }
    public string? Type { get; set; }
    public int? Episodes { get; set; }
    public string? Status { get; set; }
    public string? ImageUrl { get; set; }
    public string? LargeImageUrl { get; set; }
    public string? TrailerEmbedUrl { get; set; }
    public string? TrailerImageUrl { get; set; }
    public double? Score { get; set; }
    public int? Rank { get; set; }
    public int? Year { get; set; }
    public string? Rating { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<string> Studios { get; set; } = new();
}

public class MangaDto
{
    public long MalId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleEnglish { get; set; }
    public string? Synopsis { get; set; }
    public string? Type { get; set; }
    public int? Chapters { get; set; }
    public int? Volumes { get; set; }
    public string? Status { get; set; }
    public string? ImageUrl { get; set; }
    public string? LargeImageUrl { get; set; }
    public double? Score { get; set; }
    public int? Rank { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<string> Authors { get; set; } = new();
}

public class GenreDto
{
    public int MalId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? Count { get; set; }
}
