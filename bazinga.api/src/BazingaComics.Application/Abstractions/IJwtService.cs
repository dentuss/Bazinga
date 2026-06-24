using BazingaComics.Domain.Entities;

namespace BazingaComics.Application.Abstractions;

public interface IJwtService
{
    string GenerateToken(User user);
}
