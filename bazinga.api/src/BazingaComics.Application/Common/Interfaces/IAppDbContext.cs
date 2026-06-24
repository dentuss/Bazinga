using BazingaComics.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace BazingaComics.Application.Common.Interfaces;

/// <summary>
/// Persistence seam consumed by the Web layer. Exposing <see cref="DbSet{T}"/>
/// (plus the few EF Core primitives the controllers actually use) lets the
/// outer layers query and persist without depending on the concrete
/// <c>AppDbContext</c> in Infrastructure — the dependency points inward to this
/// Application-owned interface, and Infrastructure implements it.
/// </summary>
public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Profile> Profiles { get; }
    DbSet<SignupToken> SignupTokens { get; }
    DbSet<SigninToken> SigninTokens { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }
    DbSet<TwoFactorChallenge> TwoFactorChallenges { get; }
    DbSet<Comic> Comics { get; }
    DbSet<Category> Categories { get; }
    DbSet<ComicCondition> Conditions { get; }
    DbSet<Cart> Carts { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<Wishlist> Wishlists { get; }
    DbSet<WishlistItem> WishlistItems { get; }
    DbSet<Library> Libraries { get; }
    DbSet<LibraryItem> LibraryItems { get; }
    DbSet<ProfileCollectionItem> CollectionItems { get; }
    DbSet<Order> Orders { get; }
    DbSet<Review> Reviews { get; }
    DbSet<Report> Reports { get; }
    DbSet<ReportCategory> ReportCategories { get; }
    DbSet<NewsPost> NewsPosts { get; }

    /// <summary>Low-level DB access (transactions) used by a couple of admin flows.</summary>
    DatabaseFacade Database { get; }

    /// <summary>Change-tracking entry, used for explicit reference loading.</summary>
    EntityEntry<TEntity> Entry<TEntity>(TEntity entity) where TEntity : class;

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    int SaveChanges();
}
