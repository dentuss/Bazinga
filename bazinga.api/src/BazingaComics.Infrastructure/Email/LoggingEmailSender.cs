using System.Text.RegularExpressions;

using BazingaComics.Application.Abstractions;
using Microsoft.Extensions.Logging;
namespace BazingaComics.Infrastructure.Email;

/// <summary>
/// Stand-in for an SMTP sender used when no Email:Host is configured.
/// Writes the rendered email (and any magic link inside it) to the logs so
/// development can proceed without a real mail server.
/// </summary>
public class LoggingEmailSender : IEmailSender
{
    private static readonly Regex HrefRegex =
        new("href=\"([^\"]+)\"", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger) => _logger = logger;

    public Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var firstLink = HrefRegex.Match(htmlBody).Groups.Count > 1
            ? HrefRegex.Match(htmlBody).Groups[1].Value
            : "(no link)";

        _logger.LogWarning(
            "Email NOT sent (SMTP not configured). To={To} Subject={Subject} Link={Link}",
            to, subject, firstLink);

        return Task.CompletedTask;
    }
}
