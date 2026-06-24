using BazingaComics.Application.Dtos;

namespace BazingaComics.Application.Abstractions;

/// <summary>
/// Port for anime + manga discovery metadata (MyAnimeList via the Jikan v4
/// API). The Infrastructure implementation owns the HTTP transport, caching
/// and the raw snake_case parsing models; the Application layer only sees the
/// DTOs returned here.
/// </summary>
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
