namespace BazingaComics.Api.Dtos;

public class ComicCreateRequest
{
    public string? Title { get; set; }
    public string? Author { get; set; }
    public string? Isbn { get; set; }
    public string? Description { get; set; }
    public string? MainCharacter { get; set; }
    public string? Series { get; set; }
    public int? PublishedYear { get; set; }
    public long? ConditionId { get; set; }
    public long? CategoryId { get; set; }
    public decimal? Price { get; set; }
    public string? Image { get; set; }
    public string? ComicType { get; set; }
}

public class ComicRedactionRequest
{
    public bool Redacted { get; set; }
}
