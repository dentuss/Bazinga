using BazingaComics.Api.Dtos;
using BazingaComics.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace BazingaComics.Api.Controllers;

[ApiController]
[Route("api/metadata")]
public class MetadataController : ControllerBase
{
    private const int MaxLimit = 25;
    private const int MaxSuperheroLimit = 48;
    private const int MaxComicsLimit = 50;
    private readonly IJikanService _jikan;
    private readonly ISuperheroService _supers;
    private readonly IComicMetadataService _comics;

    public MetadataController(IJikanService jikan, ISuperheroService supers, IComicMetadataService comics)
    {
        _jikan = jikan;
        _supers = supers;
        _comics = comics;
    }

    // ---------- Anime ----------------------------------------------------

    [HttpGet("anime/top")]
    public Task<JikanPagedResponse<AnimeDto>> TopAnime(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 12,
        CancellationToken ct = default)
        => _jikan.TopAnimeAsync(Math.Max(1, page), Clamp(limit), ct);

    [HttpGet("anime/season-now")]
    public Task<JikanPagedResponse<AnimeDto>> SeasonNow(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 12,
        CancellationToken ct = default)
        => _jikan.SeasonNowAsync(Math.Max(1, page), Clamp(limit), ct);

    [HttpGet("anime/season-upcoming")]
    public Task<JikanPagedResponse<AnimeDto>> SeasonUpcoming(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 12,
        CancellationToken ct = default)
        => _jikan.SeasonUpcomingAsync(Math.Max(1, page), Clamp(limit), ct);

    [HttpGet("anime/search")]
    public Task<JikanPagedResponse<AnimeDto>> SearchAnime(
        [FromQuery] string? q = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 12,
        [FromQuery] int? genre = null,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        [FromQuery] string? orderBy = null,
        CancellationToken ct = default)
        => _jikan.SearchAnimeAsync(q, Math.Max(1, page), Clamp(limit), genre, status, type, orderBy, ct);

    [HttpGet("anime/{id:long}")]
    public async Task<ActionResult<AnimeDto>> Anime(long id, CancellationToken ct)
    {
        var dto = await _jikan.AnimeDetailAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpGet("anime/genres")]
    public Task<List<GenreDto>> AnimeGenres(CancellationToken ct) => _jikan.AnimeGenresAsync(ct);

    // ---------- Manga ----------------------------------------------------

    [HttpGet("manga/top")]
    public Task<JikanPagedResponse<MangaDto>> TopManga(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 12,
        CancellationToken ct = default)
        => _jikan.TopMangaAsync(Math.Max(1, page), Clamp(limit), ct);

    [HttpGet("manga/search")]
    public Task<JikanPagedResponse<MangaDto>> SearchManga(
        [FromQuery] string? q = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 12,
        [FromQuery] int? genre = null,
        [FromQuery] string? status = null,
        [FromQuery] string? orderBy = null,
        CancellationToken ct = default)
        => _jikan.SearchMangaAsync(q, Math.Max(1, page), Clamp(limit), genre, status, orderBy, ct);

    [HttpGet("manga/{id:long}")]
    public async Task<ActionResult<MangaDto>> Manga(long id, CancellationToken ct)
    {
        var dto = await _jikan.MangaDetailAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpGet("manga/genres")]
    public Task<List<GenreDto>> MangaGenres(CancellationToken ct) => _jikan.MangaGenresAsync(ct);

    // ---------- Superheroes (akabab) -------------------------------------

    [HttpGet("superheroes")]
    public Task<JikanPagedResponse<SuperheroDto>> Superheroes(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 24,
        [FromQuery] string? q = null,
        [FromQuery] string? publisher = null,
        [FromQuery] string? alignment = null,
        CancellationToken ct = default)
        => _supers.ListAsync(Math.Max(1, page), Math.Clamp(limit, 1, MaxSuperheroLimit), q, publisher, alignment, ct);

    [HttpGet("superheroes/publishers")]
    public Task<List<string>> SuperheroPublishers(CancellationToken ct)
        => _supers.GetPublishersAsync(ct);

    [HttpGet("superheroes/{id:int}")]
    public async Task<ActionResult<SuperheroDto>> Superhero(int id, CancellationToken ct)
    {
        var dto = await _supers.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    // ---------- Superhero shows (TVMaze) ---------------------------------

    [HttpGet("superhero-shows")]
    public Task<List<SuperheroShowDto>> SuperheroShows(CancellationToken ct)
        => _supers.GetCuratedShowsAsync(ct);

    [HttpGet("superhero-shows/search")]
    public Task<List<SuperheroShowDto>> SearchSuperheroShows(
        [FromQuery] string q,
        CancellationToken ct)
        => _supers.SearchShowsAsync(q, ct);

    [HttpGet("superhero-shows/{id:int}")]
    public async Task<ActionResult<SuperheroShowDto>> SuperheroShow(int id, CancellationToken ct)
    {
        var dto = await _supers.GetShowByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    // ---------- Comics metadata (Open Library) ---------------------------

    [HttpGet("comics")]
    public Task<ComicsMetaPagedResponse> Comics(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 24,
        [FromQuery] string? q = null,
        CancellationToken ct = default)
        => _comics.ListAsync(Math.Max(1, page), Math.Clamp(limit, 1, MaxComicsLimit), q, ct);

    [HttpGet("comics/{id:int}")]
    public async Task<ActionResult<ComicMetaDto>> Comic(int id, CancellationToken ct)
    {
        var dto = await _comics.GetAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    private static int Clamp(int limit) => Math.Clamp(limit, 1, MaxLimit);
}
