namespace BazingaComics.Api.Dtos;

public class ProfileDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string AvatarColor { get; set; } = string.Empty;
    public string? AvatarIcon { get; set; }
    public bool IsRoot { get; set; }
    public bool IsKids { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
}

public class ProfileUpsertRequest
{
    public string? Name { get; set; }
    public string? AvatarUrl { get; set; }
    public string? AvatarColor { get; set; }
    public string? AvatarIcon { get; set; }
    public bool? IsKids { get; set; }
}
