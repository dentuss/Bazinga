namespace BazingaComics.Api.Entities;

public class Comic
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Author { get; set; }
    public string? Isbn { get; set; }
    public string? Description { get; set; }
    public string? MainCharacter { get; set; }
    public string? Series { get; set; }
    public int? PublishedYear { get; set; }

    public long? ConditionId { get; set; }
    public ComicCondition? Condition { get; set; }

    public long? CategoryId { get; set; }
    public Category? Category { get; set; }

    public decimal? Price { get; set; }
    public string? Image { get; set; }
    public ComicType ComicType { get; set; } = ComicType.PHYSICAL_COPY;
    public bool Redacted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
