using System.Text.Json;
using System.Text.Json.Serialization;
using BazingaComics.Api.Dtos;

namespace BazingaComics.Api.Services;

public interface IJikanService
{
    Task<JikanPagedResponse<AnimeDto>> TopAnimeAsync(int page, int limit, CancellationToken ct);
    Task<JikanPagedResponse<AnimeDto>> SeasonNowAsync(int page, int limit, CancellationToken ct);
    Task<JikanPagedResponse<AnimeDto>> SeasonUpcomingAsync(int page, int limit, CancellationToken ct);
    Task<JikanPagedResponse<AnimeDto>> SearchAnimeAsync(
        string? query, int page, int limit,
        int? genre, string? status, string? type, string? orderBy,
        CancellationToken ct);
    Task<AnimeDto?> AnimeDetailAsync(long id, CancellationToken ct);
    Task<List<GenreDto>> AnimeGenresAsync(CancellationToken ct);

    Task<JikanPagedResponse<MangaDto>> TopMangaAsync(int page, int limit, CancellationToken ct);
    Task<JikanPagedResponse<MangaDto>> SearchMangaAsync(
        string? query, int page, int limit,
        int? genre, string? status, string? orderBy,
        CancellationToken ct);
    Task<MangaDto?> MangaDetailAsync(long id, CancellationToken ct);
    Task<List<GenreDto>> MangaGenresAsync(CancellationToken ct);
}

// --- Internal parsing models (snake_case from Jikan) -------------------------

internal class JikanEnvelope<T>
{
    [JsonPropertyName("data")] public T? Data { get; set; }
    [JsonPropertyName("pagination")] public JikanPaginationRaw? Pagination { get; set; }
}

internal class JikanPaginationRaw
{
    [JsonPropertyName("last_visible_page")] public int LastVisiblePage { get; set; }
    [JsonPropertyName("has_next_page")] public bool HasNextPage { get; set; }
    [JsonPropertyName("current_page")] public int CurrentPage { get; set; }
    [JsonPropertyName("items")] public JikanItems? Items { get; set; }
}

internal class JikanItems
{
    [JsonPropertyName("count")] public int Count { get; set; }
    [JsonPropertyName("total")] public int Total { get; set; }
    [JsonPropertyName("per_page")] public int PerPage { get; set; }
}

internal class JikanImages
{
    [JsonPropertyName("jpg")] public JikanImageSet? Jpg { get; set; }
    [JsonPropertyName("webp")] public JikanImageSet? Webp { get; set; }
}

internal class JikanImageSet
{
    [JsonPropertyName("image_url")] public string? ImageUrl { get; set; }
    [JsonPropertyName("small_image_url")] public string? SmallImageUrl { get; set; }
    [JsonPropertyName("large_image_url")] public string? LargeImageUrl { get; set; }
}

internal class JikanTrailer
{
    [JsonPropertyName("youtube_id")] public string? YoutubeId { get; set; }
    [JsonPropertyName("url")] public string? Url { get; set; }
    [JsonPropertyName("embed_url")] public string? EmbedUrl { get; set; }
    [JsonPropertyName("images")] public JikanTrailerImages? Images { get; set; }
}

internal class JikanTrailerImages
{
    [JsonPropertyName("medium_image_url")] public string? MediumImageUrl { get; set; }
    [JsonPropertyName("large_image_url")] public string? LargeImageUrl { get; set; }
    [JsonPropertyName("maximum_image_url")] public string? MaximumImageUrl { get; set; }
}

internal class JikanNamedEntity
{
    [JsonPropertyName("mal_id")] public int MalId { get; set; }
    [JsonPropertyName("name")] public string? Name { get; set; }
}

internal class JikanCountedEntity : JikanNamedEntity
{
    [JsonPropertyName("count")] public int? Count { get; set; }
}

internal class JikanAuthor
{
    [JsonPropertyName("mal_id")] public int MalId { get; set; }
    [JsonPropertyName("name")] public string? Name { get; set; }
}

internal class JikanAnime
{
    [JsonPropertyName("mal_id")] public long MalId { get; set; }
    [JsonPropertyName("title")] public string? Title { get; set; }
    [JsonPropertyName("title_english")] public string? TitleEnglish { get; set; }
    [JsonPropertyName("synopsis")] public string? Synopsis { get; set; }
    [JsonPropertyName("type")] public string? Type { get; set; }
    [JsonPropertyName("episodes")] public int? Episodes { get; set; }
    [JsonPropertyName("status")] public string? Status { get; set; }
    [JsonPropertyName("score")] public double? Score { get; set; }
    [JsonPropertyName("rank")] public int? Rank { get; set; }
    [JsonPropertyName("year")] public int? Year { get; set; }
    [JsonPropertyName("rating")] public string? Rating { get; set; }
    [JsonPropertyName("images")] public JikanImages? Images { get; set; }
    [JsonPropertyName("trailer")] public JikanTrailer? Trailer { get; set; }
    [JsonPropertyName("genres")] public List<JikanNamedEntity>? Genres { get; set; }
    [JsonPropertyName("themes")] public List<JikanNamedEntity>? Themes { get; set; }
    [JsonPropertyName("studios")] public List<JikanNamedEntity>? Studios { get; set; }
}

internal class JikanManga
{
    [JsonPropertyName("mal_id")] public long MalId { get; set; }
    [JsonPropertyName("title")] public string? Title { get; set; }
    [JsonPropertyName("title_english")] public string? TitleEnglish { get; set; }
    [JsonPropertyName("synopsis")] public string? Synopsis { get; set; }
    [JsonPropertyName("type")] public string? Type { get; set; }
    [JsonPropertyName("chapters")] public int? Chapters { get; set; }
    [JsonPropertyName("volumes")] public int? Volumes { get; set; }
    [JsonPropertyName("status")] public string? Status { get; set; }
    [JsonPropertyName("score")] public double? Score { get; set; }
    [JsonPropertyName("rank")] public int? Rank { get; set; }
    [JsonPropertyName("images")] public JikanImages? Images { get; set; }
    [JsonPropertyName("genres")] public List<JikanNamedEntity>? Genres { get; set; }
    [JsonPropertyName("themes")] public List<JikanNamedEntity>? Themes { get; set; }
    [JsonPropertyName("authors")] public List<JikanAuthor>? Authors { get; set; }
}
