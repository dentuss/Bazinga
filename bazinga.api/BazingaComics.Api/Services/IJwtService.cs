using BazingaComics.Api.Entities;

namespace BazingaComics.Api.Services;

public interface IJwtService
{
    string GenerateToken(User user);
}
