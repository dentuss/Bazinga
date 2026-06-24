namespace BazingaComics.Domain.Entities;

public class ReportCategory
{
    public long Id { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? Description { get; set; }
}
