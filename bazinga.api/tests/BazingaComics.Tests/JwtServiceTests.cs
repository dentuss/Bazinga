using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BazingaComics.Application.Options;
using BazingaComics.Domain.Entities;
using BazingaComics.Infrastructure.Identity;
using Microsoft.Extensions.Options;
using Xunit;

namespace BazingaComics.Tests;

public class JwtServiceTests
{
    private static JwtService Service(int expirationMs = 60_000) =>
        new(Options.Create(new JwtOptions
        {
            Secret = "test-secret-test-secret-test-secret-1234",
            ExpirationMs = expirationMs,
            Issuer = "bazinga-test",
            Audience = "bazinga-aud",
        }));

    [Fact]
    public void GenerateToken_EmbedsSubjectAndRole()
    {
        var user = new User { Id = 42, Username = "alice", Email = "a@b.c", Role = "ADMIN" };

        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(Service().GenerateToken(user));

        Assert.Equal("a@b.c", parsed.Subject);
        Assert.Contains(parsed.Claims, c => c.Type == "role" && c.Value == "ADMIN");
        Assert.Contains(parsed.Claims, c => c.Type == ClaimTypes.NameIdentifier && c.Value == "42");
        Assert.Contains(parsed.Claims, c => c.Type == ClaimTypes.Name && c.Value == "alice");
    }

    [Fact]
    public void GenerateToken_SetsIssuerAudienceAndFutureExpiry()
    {
        var user = new User { Id = 1, Username = "bob", Email = "b@c.d", Role = "USER" };

        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(Service().GenerateToken(user));

        Assert.Equal("bazinga-test", parsed.Issuer);
        Assert.Contains("bazinga-aud", parsed.Audiences);
        Assert.True(parsed.ValidTo > DateTime.UtcNow, "token should expire in the future");
        Assert.True(parsed.ValidTo <= DateTime.UtcNow.AddMinutes(5), "60s expiry shouldn't be hours away");
    }

    [Fact]
    public void GenerateToken_DefaultsBlankRoleToUser()
    {
        var user = new User { Id = 7, Username = "nobody", Email = "n@x.y", Role = null };

        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(Service().GenerateToken(user));

        Assert.Contains(parsed.Claims, c => c.Type == "role" && c.Value == "USER");
    }

    [Fact]
    public void GenerateToken_UppercasesRole()
    {
        var user = new User { Id = 8, Username = "editor", Email = "e@x.y", Role = "editor" };

        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(Service().GenerateToken(user));

        Assert.Contains(parsed.Claims, c => c.Type == "role" && c.Value == "EDITOR");
    }
}
