namespace BazingaComics.Api.Entities;

public class NewsPost
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    public long AuthorId { get; set; }
    public User? Author { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}
