namespace BazingaComics.Application.Options;

public class EmailOptions
{
    public const string SectionName = "Email";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromName { get; set; } = "Bazinga";
    public string FromAddress { get; set; } = "no-reply@bazinga.local";
    public string PublicBaseUrl { get; set; } = "http://localhost:8081";
}
