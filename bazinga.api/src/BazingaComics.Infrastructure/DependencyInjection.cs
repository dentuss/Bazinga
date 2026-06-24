using BazingaComics.Application.Abstractions;
using BazingaComics.Application.Common.Interfaces;
using BazingaComics.Application.Options;
using BazingaComics.Infrastructure.BackgroundServices;
using BazingaComics.Infrastructure.Billing;
using BazingaComics.Infrastructure.Email;
using BazingaComics.Infrastructure.Identity;
using BazingaComics.Infrastructure.Metadata;
using BazingaComics.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BazingaComics.Infrastructure;

/// <summary>
/// Single registration entry point for the Infrastructure layer. The Web
/// composition root calls <c>AddInfrastructure</c>; it binds the EF Core
/// DbContext (and the <see cref="IAppDbContext"/> seam), the security/email/
/// billing implementations, the cached HTTP metadata providers and the
/// background cleanup service — so Program.cs never names a concrete service.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // --- Persistence (MySQL via Pomelo) ---------------------------------
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Missing connection string 'DefaultConnection'.");
        services.AddDbContext<AppDbContext>(opt =>
            opt.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString),
                mysql => mysql.EnableRetryOnFailure()));
        // The Web layer depends on the interface, not the concrete context.
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // --- Identity / security --------------------------------------------
        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<IJwtService, JwtService>();

        // --- Email: SMTP when a host is configured, else log the magic links
        //     so local/dev runs work without a mail server. -----------------
        var emailHostConfigured =
            !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("APP_EMAIL_HOST"))
            || !string.IsNullOrWhiteSpace(configuration[$"{EmailOptions.SectionName}:Host"]);
        if (emailHostConfigured)
            services.AddSingleton<IEmailSender, SmtpEmailSender>();
        else
            services.AddSingleton<IEmailSender, LoggingEmailSender>();

        // --- Billing — Stripe; reports IsConfigured=false without keys so the
        //     signup/checkout flows fall back to a mock card form. ----------
        services.AddSingleton<IBillingService, StripeBillingService>();

        // --- Discovery metadata providers (free, no-auth, cached) -----------
        services.AddMemoryCache();
        services.AddHttpClient<IJikanService, JikanService>(client =>
        {
            client.BaseAddress = new Uri("https://api.jikan.moe/v4/");
            client.Timeout = TimeSpan.FromSeconds(15);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("BazingaComics/1.0 (+https://bazinga.local)");
        });
        services.AddHttpClient<ISuperheroService, SuperheroService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("BazingaComics/1.0 (+https://bazinga.local)");
        });
        services.AddHttpClient<IComicMetadataService, OpenLibraryComicService>(client =>
        {
            client.BaseAddress = new Uri("https://openlibrary.org/");
            client.Timeout = TimeSpan.FromSeconds(15);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("BazingaComics/1.0 (+https://bazinga.local)");
        });

        // --- Background work ------------------------------------------------
        services.AddHostedService<NewsCleanupService>();

        return services;
    }
}
