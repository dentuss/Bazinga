using System.IdentityModel.Tokens.Jwt;
using BazingaComics.Domain.Entities;
using BazingaComics.Application.Options;
using BazingaComics.Infrastructure.Identity;
using Microsoft.Extensions.Options;
using Xunit;

namespace BazingaComics.Tests;

public class JwtServiceTests
{
    [Fact]
    public void GenerateToken_EmbedsSubjectAndRole()
    {
        var options = Options.Create(new JwtOptions
        {
            Secret = "test-secret-test-secret-test-secret-1234",
            ExpirationMs = 60_000,
            Issuer = "test",
            Audience = "test"
        });
        var svc = new JwtService(options);
        var user = new User { Id = 42, Username = "alice", Email = "a@b.c", Role = "ADMIN" };

        var token = svc.GenerateToken(user);
        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.Equal("a@b.c", parsed.Subject);
        Assert.Contains(parsed.Claims, c => c.Type == "role" && c.Value == "ADMIN");
    }
}
