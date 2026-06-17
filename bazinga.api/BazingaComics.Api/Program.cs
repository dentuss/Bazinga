using System.Text;
using System.Text.Json.Serialization;
using BazingaComics.Api.Data;
using BazingaComics.Api.Security;
using BazingaComics.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicyName = "BazingaCors";

// Configuration: JWT options
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var jwtSecret = Environment.GetEnvironmentVariable("APP_SECURITY_JWT_SECRET") ?? jwtOptions.Secret;
jwtOptions.Secret = jwtSecret;

// Configuration: Email options (env vars override appsettings so prod can
// inject SMTP credentials without committing them).
builder.Services.Configure<EmailOptions>(opt =>
{
    var section = builder.Configuration.GetSection(EmailOptions.SectionName).Get<EmailOptions>() ?? new EmailOptions();
    opt.Host = Environment.GetEnvironmentVariable("APP_EMAIL_HOST") ?? section.Host;
    opt.Port = int.TryParse(Environment.GetEnvironmentVariable("APP_EMAIL_PORT"), out var port) ? port : section.Port;
    opt.UseSsl = bool.TryParse(Environment.GetEnvironmentVariable("APP_EMAIL_USE_SSL"), out var ssl) ? ssl : section.UseSsl;
    opt.Username = Environment.GetEnvironmentVariable("APP_EMAIL_USERNAME") ?? section.Username;
    opt.Password = Environment.GetEnvironmentVariable("APP_EMAIL_PASSWORD") ?? section.Password;
    opt.FromName = Environment.GetEnvironmentVariable("APP_EMAIL_FROM_NAME") ?? section.FromName;
    opt.FromAddress = Environment.GetEnvironmentVariable("APP_EMAIL_FROM_ADDRESS") ?? section.FromAddress;
    opt.PublicBaseUrl = Environment.GetEnvironmentVariable("APP_PUBLIC_BASE_URL") ?? section.PublicBaseUrl;
});

// Configuration: Stripe options (env vars override appsettings).
builder.Services.Configure<StripeOptions>(opt =>
{
    var section = builder.Configuration.GetSection(StripeOptions.SectionName).Get<StripeOptions>() ?? new StripeOptions();
    opt.SecretKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY") ?? section.SecretKey;
    opt.PublishableKey = Environment.GetEnvironmentVariable("STRIPE_PUBLISHABLE_KEY") ?? section.PublishableKey;
});

// EF Core + MySQL via Pomelo
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing connection string 'DefaultConnection'.");
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString),
        mysql => mysql.EnableRetryOnFailure()));

// CORS — permissive for dev; tighten in production via config
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(opt => opt.AddPolicy(CorsPolicyName, policy =>
{
    if (allowedOrigins.Length == 0)
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    }
    else
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    }
}));

// Authentication + Authorization
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.SaveToken = true;
        opt.RequireHttpsMetadata = false;
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromSeconds(30),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.Name
        };
    });
builder.Services.AddAuthorization();

// Services
builder.Services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddHostedService<NewsCleanupService>();

// Email — SMTP if a host is configured, otherwise log magic links so
// development without a mail server still works.
var emailHostConfigured =
    !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("APP_EMAIL_HOST"))
    || !string.IsNullOrWhiteSpace(builder.Configuration[$"{EmailOptions.SectionName}:Host"]);
if (emailHostConfigured)
{
    builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
}
else
{
    builder.Services.AddSingleton<IEmailSender, LoggingEmailSender>();
}

// Billing — Stripe (test or live keys). The service reports IsConfigured=false
// when keys are missing; the signup wizard then falls back to a mock card form.
builder.Services.AddSingleton<IBillingService, StripeBillingService>();

// Metadata proxy → Jikan v4 (no auth, MyAnimeList data for anime + manga).
// Cached in-memory so repeat requests don't hit Jikan and stay within their
// ~3 req/sec rate budget.
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<IJikanService, JikanService>(client =>
{
    client.BaseAddress = new Uri("https://api.jikan.moe/v4/");
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("BazingaComics/1.0 (+https://bazinga.local)");
});

// Superhero metadata: akabab/superhero-api (characters, static JSON) and
// TVMaze (shows). Both are free, no-auth; results are cached for hours so
// each upstream is hit at most a handful of times per day.
builder.Services.AddHttpClient<ISuperheroService, SuperheroService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("BazingaComics/1.0 (+https://bazinga.local)");
});

// Comics metadata — Open Library (free, no auth). Real covers + descriptions
// for Marvel/DC/indie comics; replaces the discontinued Marvel API.
builder.Services.AddHttpClient<IComicMetadataService, OpenLibraryComicService>(client =>
{
    client.BaseAddress = new Uri("https://openlibrary.org/");
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("BazingaComics/1.0 (+https://bazinga.local)");
});

// Controllers + JSON
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opt.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        opt.JsonSerializerOptions.ReferenceHandler = null;
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Bazinga Comics API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT bearer token. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Apply schema + seed on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
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
    // an older database. MySQL lacks `ADD COLUMN IF NOT EXISTS`, so AddColumnIfMissing
    // just attempts the ALTER and treats the duplicate-column error as a no-op.
    AddColumnIfMissing(db, "users", "phone", "VARCHAR(50) NULL");
    AddColumnIfMissing(db, "users", "two_factor_enabled", "TINYINT(1) NOT NULL DEFAULT 0");
    AddColumnIfMissing(db, "users", "two_factor_secret", "VARCHAR(64) NULL");
    AddColumnIfMissing(db, "profiles", "pin_hash", "VARCHAR(255) NULL");
}

// Local helper kept inline so the startup file stays self-contained.
// MySQL lacks `ADD COLUMN IF NOT EXISTS`, and Pomelo's ExecuteSqlRaw is a
// single-command pipeline so the INFORMATION_SCHEMA / PREPARE dance is fragile.
// Instead we just attempt the ALTER and swallow MySQL error 1060 (duplicate
// column name) — the only failure mode we care about treating as a no-op.
static void AddColumnIfMissing(AppDbContext db, string table, string column, string definition)
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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
