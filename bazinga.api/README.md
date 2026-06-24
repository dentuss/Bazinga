# Bazinga Comics — Backend (ASP.NET Core)

ASP.NET Core 9 Web API for the Bazinga Comics platform. Replaces the previous
Spring Boot backend while preserving the same HTTP API contract.

## Stack

- ASP.NET Core 9 (controllers)
- EF Core 9 + Pomelo MySQL provider
- JWT bearer authentication (HS256)
- BCrypt password hashing
- Swashbuckle / Swagger
- CORS configured per environment
- Background `NewsCleanupService` purges expired news hourly

## Architecture (Clean Architecture)

Four projects with dependencies pointing strictly inward
(`Web → Infrastructure → Application → Domain`):

```
src/
  BazingaComics.Domain          entities + enums, zero dependencies
  BazingaComics.Application      DTOs, port interfaces (IAppDbContext, IJwtService,
                                IEmailSender, IBillingService, the metadata ports),
                                pure business services (PricingService), options
  BazingaComics.Infrastructure  EF Core DbContext (implements IAppDbContext),
                                MySQL, JWT, BCrypt, SMTP, Stripe, Jikan/Superhero/
                                Open Library clients, background services,
                                AddInfrastructure() composition module
  BazingaComics.Web             controllers, auth/CORS/Swagger, Program.cs
                                (composition root)
tests/
  BazingaComics.Tests           xUnit tests (Application + Infrastructure)
```

The Web layer queries through the Application-owned `IAppDbContext` seam rather
than the concrete `AppDbContext`, so persistence stays an Infrastructure detail.

## Running locally

```bash
cd bazinga.api
dotnet restore
dotnet run --project src/BazingaComics.Web
```

Or run the whole stack (DB + API + SPA) from the repo root with
`docker compose up --build`.

The app listens on `http://localhost:8080`, serves Swagger at `/swagger`, and
calls `DbContext.EnsureCreated()` at startup to provision the schema in an
empty MySQL database.

## Configuration

`appsettings.json`:

- `ConnectionStrings:DefaultConnection` — MySQL connection string
- `Jwt:Secret` / `Jwt:ExpirationMs` / `Jwt:Issuer` / `Jwt:Audience`
- `Cors:AllowedOrigins` — array; empty means allow any origin in dev

Environment variable overrides:

- `APP_SECURITY_JWT_SECRET` — overrides `Jwt:Secret`

## Schema / migrations

On first run, `DbInitializer.Initialize()` (Infrastructure) calls
`Database.EnsureCreated()` and idempotently forward-patches older databases. A
raw SQL reference script lives at
`src/BazingaComics.Infrastructure/Persistence/init.sql`.

## HTTP API

All endpoints match the contract the React frontend already speaks:

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/comics`, `POST /api/comics` (admin)
- `GET /api/admin/comics`, `PUT /api/admin/comics/{id}`,
  `PUT /api/admin/comics/{id}/redaction`, `DELETE /api/admin/comics/{id}`
- `GET|POST|PUT|DELETE /api/cart`, `DELETE /api/cart/{cartItemId}`
- `GET|POST /api/wishlist`, `DELETE /api/wishlist/{comicId}`
- `GET|POST /api/library`
- `POST /api/subscriptions/subscribe`
- `GET|POST /api/news`
- `GET|POST|PUT /api/admin/users`
- `GET /api/categories`, `GET /api/conditions`
