using BazingaComics.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Entities.Profile> Profiles => Set<Entities.Profile>();
    public DbSet<Comic> Comics => Set<Comic>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ComicCondition> Conditions => Set<ComicCondition>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<Library> Libraries => Set<Library>();
    public DbSet<LibraryItem> LibraryItems => Set<LibraryItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<ReportCategory> ReportCategories => Set<ReportCategory>();
    public DbSet<NewsPost> NewsPosts => Set<NewsPost>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.ToTable("users");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Username).HasColumnName("username").HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            e.Property(x => x.Password).HasColumnName("password").HasMaxLength(255).IsRequired();
            e.Property(x => x.FirstName).HasColumnName("first_name").HasMaxLength(100);
            e.Property(x => x.LastName).HasColumnName("last_name").HasMaxLength(100);
            e.Property(x => x.DateOfBirth).HasColumnName("date_of_birth");
            e.Property(x => x.Role).HasColumnName("role").HasMaxLength(50);
            e.Property(x => x.SubscriptionType).HasColumnName("subscription_type").HasMaxLength(20);
            e.Property(x => x.SubscriptionExpiration).HasColumnName("subscription_expiration");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(x => x.Username).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
        });

        b.Entity<Entities.Profile>(e =>
        {
            e.ToTable("profiles");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(500);
            e.Property(x => x.AvatarColor).HasColumnName("avatar_color").HasMaxLength(20).IsRequired();
            e.Property(x => x.AvatarIcon).HasColumnName("avatar_icon").HasMaxLength(20);
            e.Property(x => x.IsRoot).HasColumnName("is_root").HasDefaultValue(false);
            e.Property(x => x.IsKids).HasColumnName("is_kids").HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(x => x.UserId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Category>(e =>
        {
            e.ToTable("categories");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<ComicCondition>(e =>
        {
            e.ToTable("conditions");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Description).HasColumnName("condition_description").HasMaxLength(150).IsRequired();
            e.HasIndex(x => x.Description).IsUnique();
        });

        b.Entity<Comic>(e =>
        {
            e.ToTable("comics");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
            e.Property(x => x.Author).HasColumnName("author").HasMaxLength(255);
            e.Property(x => x.Isbn).HasColumnName("isbn").HasMaxLength(30);
            e.Property(x => x.Description).HasColumnName("description").HasColumnType("TEXT");
            e.Property(x => x.MainCharacter).HasColumnName("main_character").HasMaxLength(255);
            e.Property(x => x.Series).HasColumnName("series").HasMaxLength(255);
            e.Property(x => x.PublishedYear).HasColumnName("published_year");
            e.Property(x => x.ConditionId).HasColumnName("condition_id");
            e.Property(x => x.CategoryId).HasColumnName("category_id");
            e.Property(x => x.Price).HasColumnName("price").HasColumnType("DECIMAL(10,2)");
            e.Property(x => x.Image).HasColumnName("image").HasMaxLength(500);
            e.Property(x => x.ComicType).HasColumnName("comic_type").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.Redacted).HasColumnName("redacted").HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(x => x.Isbn).IsUnique();
            e.HasOne(x => x.Condition).WithMany().HasForeignKey(x => x.ConditionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Cart>(e =>
        {
            e.ToTable("carts");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(x => x.UserId).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Items).WithOne(i => i.Cart!).HasForeignKey(i => i.CartId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CartItem>(e =>
        {
            e.ToTable("cart_items");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.CartId).HasColumnName("cart_id").IsRequired();
            e.Property(x => x.ComicId).HasColumnName("comic_id").IsRequired();
            e.Property(x => x.Quantity).HasColumnName("quantity").IsRequired();
            e.Property(x => x.PurchaseType).HasColumnName("purchase_type").HasConversion<string>().HasMaxLength(20).IsRequired();
            e.Property(x => x.UnitPrice).HasColumnName("unit_price").HasColumnType("DECIMAL(10,2)").HasDefaultValue(0m).IsRequired();
            e.HasIndex(x => new { x.CartId, x.ComicId, x.PurchaseType }).IsUnique();
            e.HasOne(x => x.Comic).WithMany().HasForeignKey(x => x.ComicId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Wishlist>(e =>
        {
            e.ToTable("wishlists");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Items).WithOne(i => i.Wishlist!).HasForeignKey(i => i.WishlistId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<WishlistItem>(e =>
        {
            e.ToTable("wishlist_items");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.WishlistId).HasColumnName("wishlist_id").IsRequired();
            e.Property(x => x.ComicId).HasColumnName("comic_id").IsRequired();
            e.Property(x => x.AddedAt).HasColumnName("added_at");
            e.HasIndex(x => new { x.WishlistId, x.ComicId }).IsUnique();
            e.HasOne(x => x.Comic).WithMany().HasForeignKey(x => x.ComicId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Library>(e =>
        {
            e.ToTable("libraries");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.HasIndex(x => x.UserId).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.Items).WithOne(i => i.Library!).HasForeignKey(i => i.LibraryId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<LibraryItem>(e =>
        {
            e.ToTable("library_items");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.LibraryId).HasColumnName("library_id").IsRequired();
            e.Property(x => x.ComicId).HasColumnName("comic_id").IsRequired();
            e.Property(x => x.AddedAt).HasColumnName("added_at").IsRequired();
            e.HasIndex(x => new { x.LibraryId, x.ComicId }).IsUnique();
            e.HasOne(x => x.Comic).WithMany().HasForeignKey(x => x.ComicId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Order>(e =>
        {
            e.ToTable("orders");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            e.Property(x => x.TotalAmount).HasColumnName("total_amount").HasColumnType("DECIMAL(10,2)");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(50);
            e.Property(x => x.ShippingAddress).HasColumnName("shipping_address").HasMaxLength(500);
            e.Property(x => x.BillingAddress).HasColumnName("billing_address").HasMaxLength(500);
            e.Property(x => x.OrderDate).HasColumnName("order_date");
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Review>(e =>
        {
            e.ToTable("reviews");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            e.Property(x => x.ComicId).HasColumnName("comic_id").IsRequired();
            e.Property(x => x.Rating).HasColumnName("rating").IsRequired();
            e.Property(x => x.Comment).HasColumnName("comment").HasColumnType("TEXT");
            e.Property(x => x.ReviewDate).HasColumnName("review_date");
            e.ToTable(t => t.HasCheckConstraint("ck_review_rating", "rating BETWEEN 1 AND 5"));
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Comic).WithMany().HasForeignKey(x => x.ComicId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ReportCategory>(e =>
        {
            e.ToTable("report_categories");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.CategoryName).HasColumnName("category_name").HasMaxLength(150).IsRequired();
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.HasIndex(x => x.CategoryName).IsUnique();
        });

        b.Entity<Report>(e =>
        {
            e.ToTable("reports");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.ReportText).HasColumnName("report_text").HasColumnType("TEXT");
            e.Property(x => x.ReportDate).HasColumnName("report_date");
            e.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            e.Property(x => x.ComicId).HasColumnName("comic_id").IsRequired();
            e.Property(x => x.ReportCategoryId).HasColumnName("report_category_id").IsRequired();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Comic).WithMany().HasForeignKey(x => x.ComicId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ReportCategory).WithMany().HasForeignKey(x => x.ReportCategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<NewsPost>(e =>
        {
            e.ToTable("news_posts");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
            e.Property(x => x.Content).HasColumnName("content").HasColumnType("TEXT").IsRequired();
            e.Property(x => x.AuthorId).HasColumnName("author_id").IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.ExpiresAt).HasColumnName("expires_at");
            e.HasOne(x => x.Author).WithMany().HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override int SaveChanges()
    {
        ApplyTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyTimestamps()
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                TrySet(entry, "CreatedAt", now);
                TrySet(entry, "UpdatedAt", now);
                TrySet(entry, "OrderDate", now);
                TrySet(entry, "ReviewDate", now);
                TrySet(entry, "ReportDate", now);
                TrySet(entry, "AddedAt", now);
                if (entry.Entity is NewsPost np && np.ExpiresAt == default)
                {
                    np.ExpiresAt = now.AddDays(7);
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                TrySet(entry, "UpdatedAt", now);
            }
        }
    }

    private static void TrySet(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry, string name, DateTime value)
    {
        var prop = entry.Metadata.FindProperty(name);
        if (prop is null) return;
        var current = entry.Property(name).CurrentValue;
        if (entry.State == EntityState.Added && (current is null || (current is DateTime dt && dt == default)))
        {
            entry.Property(name).CurrentValue = value;
        }
        else if (entry.State == EntityState.Modified)
        {
            entry.Property(name).CurrentValue = value;
        }
    }
}
