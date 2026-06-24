namespace BazingaComics.Application.Dtos;

/// <summary>Payload for adding an item to a profile collection.</summary>
public class CollectionItemRequest
{
    public string Kind { get; set; } = string.Empty;
    public string ContentId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string? Subtitle { get; set; }
    public string? PayloadJson { get; set; }
}

public class CollectionItemDto
{
    public long Id { get; set; }
    public string Collection { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string ContentId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string? Subtitle { get; set; }
    public string? PayloadJson { get; set; }
    public string AddedAt { get; set; } = string.Empty;
}
