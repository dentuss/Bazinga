namespace BazingaComics.Application.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = "change-me-in-dev-change-me-in-dev-123456";
    public long ExpirationMs { get; set; } = 3_600_000;
    public string Issuer { get; set; } = "BazingaComics";
    public string Audience { get; set; } = "BazingaComics";
}
