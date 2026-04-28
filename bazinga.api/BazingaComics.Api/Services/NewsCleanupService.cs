using BazingaComics.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Services;

public class NewsCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NewsCleanupService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    public NewsCleanupService(IServiceScopeFactory scopeFactory, ILogger<NewsCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await AlignToTopOfHour(stoppingToken);
        using var timer = new PeriodicTimer(Interval);

        do
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var now = DateTime.UtcNow;
                var removed = await db.NewsPosts
                    .Where(p => p.ExpiresAt < now)
                    .ExecuteDeleteAsync(stoppingToken);
                if (removed > 0)
                {
                    _logger.LogInformation("Purged {Count} expired news posts", removed);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "News cleanup iteration failed");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private static async Task AlignToTopOfHour(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var nextHour = new DateTime(now.Year, now.Month, now.Day, now.Hour, 0, 0, DateTimeKind.Utc).AddHours(1);
        var delay = nextHour - now;
        if (delay > TimeSpan.Zero)
        {
            try { await Task.Delay(delay, ct); }
            catch (OperationCanceledException) { }
        }
    }
}
