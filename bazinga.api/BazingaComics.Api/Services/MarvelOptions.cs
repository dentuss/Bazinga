namespace BazingaComics.Api.Services;

/// <summary>
/// Marvel Developer API credentials. Both keys are issued for free at
/// developer.marvel.com; we sign every request with MD5(ts+private+public).
/// When neither key is configured the service runs in a "graceful disable" mode
/// — endpoints return empty lists so the client can fall back to placeholders.
/// </summary>
public class MarvelOptions
{
    public const string SectionName = "Marvel";
    public string? PublicKey { get; set; }
    public string? PrivateKey { get; set; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(PublicKey) && !string.IsNullOrWhiteSpace(PrivateKey);
}
