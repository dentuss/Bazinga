using System.Security.Claims;
using BazingaComics.Application.Common.Interfaces;
using BazingaComics.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Web.Security;

public static class CurrentUser
{
    public static async Task<User?> GetAsync(ClaimsPrincipal principal, IAppDbContext db, CancellationToken ct = default)
    {
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var email = principal.FindFirstValue(ClaimTypes.Email)
                    ?? principal.FindFirstValue("sub")
                    ?? principal.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);

        var idClaim = principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (long.TryParse(idClaim, out var id))
        {
            var byId = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
            if (byId is not null) return byId;
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            return await db.Users.FirstOrDefaultAsync(u => u.Email == email || u.Username == email, ct);
        }

        return null;
    }
}
