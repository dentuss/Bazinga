namespace BazingaComics.Application.Dtos;

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

// ---- Superheroes (akabab/superhero-api) -------------------------------------

public class SuperheroImagesDto
{
    public string? Xs { get; set; }
    public string? Sm { get; set; }
    public string? Md { get; set; }
    public string? Lg { get; set; }
}

public class SuperheroPowerstatsDto
{
    public int Intelligence { get; set; }
    public int Strength { get; set; }
    public int Speed { get; set; }
    public int Durability { get; set; }
    public int Power { get; set; }
    public int Combat { get; set; }
}

public class SuperheroDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Publisher { get; set; }
    public string? Alignment { get; set; }
    public string? Race { get; set; }
    public string? Gender { get; set; }
    public string? Occupation { get; set; }
    public string? GroupAffiliation { get; set; }
    public string? PlaceOfBirth { get; set; }
    public List<string> Aliases { get; set; } = new();
    public SuperheroImagesDto Images { get; set; } = new();
    public SuperheroPowerstatsDto Powerstats { get; set; } = new();
}

// ---- Superhero TV shows (TVMaze) --------------------------------------------

public class SuperheroShowDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Type { get; set; }
    public string? Language { get; set; }
    public List<string> Genres { get; set; } = new();
    public string? Status { get; set; }
    public int? Runtime { get; set; }
    public string? Premiered { get; set; }
    public string? Ended { get; set; }
    public string? Summary { get; set; }
    public string? ImageMedium { get; set; }
    public string? ImageOriginal { get; set; }
    public string? NetworkName { get; set; }
    public string? OfficialSite { get; set; }
    public double? Rating { get; set; }
}
