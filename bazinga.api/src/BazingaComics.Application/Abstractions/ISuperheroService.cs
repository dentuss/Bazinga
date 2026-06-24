using BazingaComics.Application.Dtos;

namespace BazingaComics.Application.Abstractions;

public interface ISuperheroService
{
    Task<JikanPagedResponse<SuperheroDto>> ListAsync(
        int page, int limit, string? query, string? publisher, string? alignment,
        CancellationToken ct);

    Task<SuperheroDto?> GetByIdAsync(int id, CancellationToken ct);

    Task<List<string>> GetPublishersAsync(CancellationToken ct);

    Task<List<SuperheroShowDto>> GetCuratedShowsAsync(CancellationToken ct);

    Task<List<SuperheroShowDto>> SearchShowsAsync(string query, CancellationToken ct);

    Task<SuperheroShowDto?> GetShowByIdAsync(int id, CancellationToken ct);
}
