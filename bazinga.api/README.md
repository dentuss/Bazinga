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

## Projects

- `BazingaComics.Api` — web API
- `BazingaComics.Tests` — xUnit tests

## Running locally

```bash
cd bazingaBE
dotnet restore
dotnet run --project BazingaComics.Api
```

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

On first run, `Database.EnsureCreated()` creates the schema from the EF Core
model. For teams that prefer real migrations, run
`dotnet ef migrations add InitialCreate --project BazingaComics.Api` and switch
`Program.cs` to `db.Database.Migrate()`. A raw SQL reference script lives at
`BazingaComics.Api/Data/init.sql` (mirrors the original Flyway V1 plus the
`news_posts` table and subscription columns).

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
