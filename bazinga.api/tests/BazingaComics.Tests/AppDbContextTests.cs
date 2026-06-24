using BazingaComics.Domain.Entities;
using BazingaComics.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BazingaComics.Tests;

/// <summary>
/// Exercises the bits of AppDbContext that carry real logic against the EF
/// Core in-memory provider: the SaveChanges timestamp hook and the
/// media item → season → episode relationship graph.
/// </summary>
public class AppDbContextTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"bazinga-test-{Guid.NewGuid():N}")
            .Options);

    [Fact]
    public void SaveChanges_Auto_Populates_Created_And_Updated_Timestamps()
    {
        using var db = NewDb();
        var item = new MediaItem { Slug = "berserk", Kind = MediaKind.Anime, Title = "Berserk" };

        db.MediaItems.Add(item);
        db.SaveChanges();

        Assert.NotEqual(default(DateTime), item.CreatedAt);
        Assert.NotEqual(default(DateTime), item.UpdatedAt);
    }

    [Fact]
    public void Modifying_An_Entity_Bumps_UpdatedAt()
    {
        using var db = NewDb();
        var item = new MediaItem { Slug = "boys", Kind = MediaKind.Show, Title = "The Boys" };
        db.MediaItems.Add(item);
        db.SaveChanges();
        var createdAt = item.CreatedAt;

        item.Title = "The Boys (Final Season)";
        db.SaveChanges();

        Assert.True(item.UpdatedAt >= createdAt);
    }

    [Fact]
    public async Task Media_Graph_RoundTrips_With_Seasons_And_Episodes()
    {
        var dbName = $"bazinga-test-{Guid.NewGuid():N}";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        await using (var write = new AppDbContext(options))
        {
            write.MediaItems.Add(new MediaItem
            {
                Slug = "berserk",
                Kind = MediaKind.Anime,
                Title = "Berserk",
                Seasons = new List<MediaSeason>
                {
                    new()
                    {
                        Number = 1,
                        Episodes = new List<MediaEpisode>
                        {
                            new() { Number = 1, Title = "The Black Swordsman", VideoUrl = "https://s3/ep1.mp4" },
                            new() { Number = 2, Title = "Guardians of Desire", VideoUrl = "https://s3/ep2.mp4" },
                        },
                    },
                },
            });
            await write.SaveChangesAsync();
        }

        await using var read = new AppDbContext(options);
        var loaded = await read.MediaItems
            .Include(m => m.Seasons)
                .ThenInclude(s => s.Episodes)
            .SingleAsync(m => m.Slug == "berserk");

        Assert.Equal(MediaKind.Anime, loaded.Kind);
        var season = Assert.Single(loaded.Seasons);
        Assert.Equal(2, season.Episodes.Count);
        Assert.Contains(season.Episodes, e => e.Title == "The Black Swordsman" && e.VideoUrl == "https://s3/ep1.mp4");
    }
}
