namespace BazingaComics.Domain.Entities;

public class SignupToken
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ConsumedAt { get; set; }
    public bool OptOutMarketing { get; set; }
}
