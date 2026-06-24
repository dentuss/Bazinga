using System.Text.Json.Serialization;

namespace BazingaComics.Infrastructure.Metadata;

// --- Internal parsing models (snake_case from Jikan) -------------------------
// These are an implementation detail of JikanService — the raw shapes returned
// by api.jikan.moe before they're mapped to the Application DTOs. They live in
// Infrastructure so the Application port (IJikanService) stays free of any
// transport concerns.

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
