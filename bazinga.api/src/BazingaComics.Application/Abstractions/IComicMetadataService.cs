using BazingaComics.Application.Dtos;

namespace BazingaComics.Application.Abstractions;

/// <summary>
/// Port for comic-book discovery metadata (covers, authors, descriptions,
/// genres). The Infrastructure implementation sources this from the free,
/// no-auth Open Library API.
/// </summary>
public interface IComicMetadataService
{
    Task<ComicsMetaPagedResponse> ListAsync(int page, int limit, string? query, CancellationToken ct);
    Task<ComicMetaDto?> GetAsync(int id, CancellationToken ct);
}
