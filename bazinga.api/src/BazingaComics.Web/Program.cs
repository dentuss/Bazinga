using System.Text;
using System.Text.Json.Serialization;
using BazingaComics.Application.Options;
using BazingaComics.Infrastructure;
using BazingaComics.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicyName = "BazingaCors";

// ---------------------------------------------------------------------------
// Options — env vars override appsettings so production can inject secrets
// without committing them. PostConfigure re-applies the JWT secret override to
// the registered options so token *creation* (JwtService) and token
// *validation* (the bearer handler) always use the same effective secret.
// ---------------------------------------------------------------------------
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.PostConfigure<JwtOptions>(o =>
{
    var envSecret = Environment.GetEnvironmentVariable("APP_SECURITY_JWT_SECRET");
    if (!string.IsNullOrWhiteSpace(envSecret)) o.Secret = envSecret;
});
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var jwtSecret = Environment.GetEnvironmentVariable("APP_SECURITY_JWT_SECRET") ?? jwtOptions.Secret;

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

builder.Services.Configure<StripeOptions>(opt =>
{
    var section = builder.Configuration.GetSection(StripeOptions.SectionName).Get<StripeOptions>() ?? new StripeOptions();
    opt.SecretKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY") ?? section.SecretKey;
    opt.PublishableKey = Environment.GetEnvironmentVariable("STRIPE_PUBLISHABLE_KEY") ?? section.PublishableKey;
});

// ---------------------------------------------------------------------------
// Infrastructure — DbContext + IAppDbContext, identity, email, billing, the
// cached metadata HTTP clients and the background cleanup service.
// ---------------------------------------------------------------------------
builder.Services.AddInfrastructure(builder.Configuration);

// CORS — permissive when no origins are configured (dev), locked down in prod.
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

// Apply schema + idempotent forward-patches on startup.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    DbInitializer.Initialize(db);
}

// Behind the nginx reverse proxy: honour X-Forwarded-For / X-Forwarded-Proto so
// the app sees the real client IP and the https scheme. Networks/proxies are
// cleared because the proxy is a trusted peer on the internal compose network.
var forwardedHeaders = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
forwardedHeaders.KnownNetworks.Clear();
forwardedHeaders.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeaders);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();

// Lightweight, anonymous liveness probe for the container/edge health checks.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapControllers();

app.Run();
