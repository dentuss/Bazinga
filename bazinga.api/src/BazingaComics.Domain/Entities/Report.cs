using System.Text.Json.Serialization;

namespace BazingaComics.Domain.Entities;

public class Report
{
    public long Id { get; set; }
    public string? ReportText { get; set; }
    public DateTime ReportDate { get; set; }

    public long UserId { get; set; }

    [JsonIgnore]
    public User? User { get; set; }

    public long ComicId { get; set; }

    [JsonIgnore]
    public Comic? Comic { get; set; }

    public long ReportCategoryId { get; set; }
    public ReportCategory? ReportCategory { get; set; }
}
