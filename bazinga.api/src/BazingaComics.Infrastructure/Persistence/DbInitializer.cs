using Microsoft.EntityFrameworkCore;

namespace BazingaComics.Infrastructure.Persistence;

/// <summary>
/// Idempotent database bootstrap run once at startup. Creates the schema if the
/// database is empty and forward-patches older databases with tables/columns
/// that arrived after the original schema, so deployments never need a wipe.
///
/// This was previously inline in Program.cs; it is a persistence concern, so it
/// belongs in Infrastructure behind the composition root.
/// </summary>
public static class DbInitializer
{
    public static void Initialize(AppDbContext db)
    {
        db.Database.EnsureCreated();

        // Older databases were created before the profiles / signup_tokens tables
        // existed; add them idempotently so deployments do not need to wipe data.
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS profiles (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                name VARCHAR(100) NOT NULL,
                avatar_url VARCHAR(500) NULL,
                avatar_color VARCHAR(20) NOT NULL DEFAULT '#E50914',
                avatar_icon VARCHAR(20) NULL,
                is_root TINYINT(1) NOT NULL DEFAULT 0,
                is_kids TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME(6) NOT NULL,
                updated_at DATETIME(6) NOT NULL,
                INDEX ix_profiles_user_id (user_id),
                CONSTRAINT fk_profiles_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );");

        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS signup_tokens (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                token_hash VARCHAR(128) NOT NULL,
                expires_at DATETIME(6) NOT NULL,
                created_at DATETIME(6) NOT NULL,
                consumed_at DATETIME(6) NULL,
                opt_out_marketing TINYINT(1) NOT NULL DEFAULT 0,
                UNIQUE INDEX ix_signup_tokens_token_hash (token_hash),
                INDEX ix_signup_tokens_email (email)
            );");

        // Per-profile collections (Comics "Library" + BazingaTV "My List"). Added
        // after the original schema, so create it idempotently for existing DBs.
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS profile_collection_items (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                profile_id BIGINT NOT NULL,
                collection VARCHAR(20) NOT NULL,
                kind VARCHAR(20) NOT NULL,
                content_id VARCHAR(100) NOT NULL,
                title VARCHAR(300) NOT NULL,
                image VARCHAR(1000) NULL,
                subtitle VARCHAR(500) NULL,
                payload_json LONGTEXT NULL,
                added_at DATETIME(6) NOT NULL,
                UNIQUE INDEX ux_pci_unique (profile_id, collection, kind, content_id),
                INDEX ix_pci_profile (profile_id, collection),
                CONSTRAINT fk_pci_profiles FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
            );");

        // Magic-link sign-in tokens (separate table from signup_tokens so we don't
        // have to ALTER an existing one).
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS signin_tokens (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                token_hash VARCHAR(128) NOT NULL,
                expires_at DATETIME(6) NOT NULL,
                created_at DATETIME(6) NOT NULL,
                consumed_at DATETIME(6) NULL,
                UNIQUE INDEX ix_signin_tokens_token_hash (token_hash),
                INDEX ix_signin_tokens_email (email)
            );");

        // Password reset tokens (same shape).
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                token_hash VARCHAR(128) NOT NULL,
                expires_at DATETIME(6) NOT NULL,
                created_at DATETIME(6) NOT NULL,
                consumed_at DATETIME(6) NULL,
                UNIQUE INDEX ix_pwreset_token_hash (token_hash),
                INDEX ix_pwreset_email (email)
            );");

        // TOTP 2FA challenge handles (one-shot, post-first-factor).
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS two_factor_challenges (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                token_hash VARCHAR(128) NOT NULL,
                expires_at DATETIME(6) NOT NULL,
                created_at DATETIME(6) NOT NULL,
                consumed_at DATETIME(6) NULL,
                UNIQUE INDEX ix_2fa_challenge_token_hash (token_hash),
                INDEX ix_2fa_challenge_user (user_id)
            );");

        // Add columns that arrived after the original schema if they're missing on
        // an older database. MySQL lacks `ADD COLUMN IF NOT EXISTS`, so
        // AddColumnIfMissing just attempts the ALTER and treats the duplicate
        // column error as a no-op.
        AddColumnIfMissing(db, "users", "phone", "VARCHAR(50) NULL");
        AddColumnIfMissing(db, "users", "two_factor_enabled", "TINYINT(1) NOT NULL DEFAULT 0");
        AddColumnIfMissing(db, "users", "two_factor_secret", "VARCHAR(64) NULL");
        AddColumnIfMissing(db, "profiles", "pin_hash", "VARCHAR(255) NULL");
    }

    // MySQL lacks `ADD COLUMN IF NOT EXISTS`, and Pomelo's ExecuteSqlRaw is a
    // single-command pipeline so the INFORMATION_SCHEMA / PREPARE dance is fragile.
    // Instead we just attempt the ALTER and swallow MySQL error 1060 (duplicate
    // column name) — the only failure mode we care about treating as a no-op.
    private static void AddColumnIfMissing(AppDbContext db, string table, string column, string definition)
    {
        try
        {
            db.Database.ExecuteSqlRaw($"ALTER TABLE `{table}` ADD COLUMN `{column}` {definition};");
        }
        catch (Exception)
        {
            // Column already exists (1060) or table not present yet — fine; the EF
            // mapping only reads/writes the column when it really exists.
        }
    }
}
