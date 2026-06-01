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
