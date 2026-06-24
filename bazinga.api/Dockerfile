# syntax=docker/dockerfile:1

# ---- Build stage -----------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the solution + every csproj first so `restore` is cached independently
# of source changes (layer only busts when a project file changes).
COPY BazingaComics.sln ./
COPY src/BazingaComics.Domain/BazingaComics.Domain.csproj                 src/BazingaComics.Domain/
COPY src/BazingaComics.Application/BazingaComics.Application.csproj       src/BazingaComics.Application/
COPY src/BazingaComics.Infrastructure/BazingaComics.Infrastructure.csproj src/BazingaComics.Infrastructure/
COPY src/BazingaComics.Web/BazingaComics.Web.csproj                       src/BazingaComics.Web/
COPY tests/BazingaComics.Tests/BazingaComics.Tests.csproj                tests/BazingaComics.Tests/
RUN dotnet restore src/BazingaComics.Web/BazingaComics.Web.csproj

# Now copy the rest of the source and publish the web entrypoint.
COPY . .
RUN dotnet publish src/BazingaComics.Web/BazingaComics.Web.csproj \
        -c Release \
        --no-restore \
        -o /app/publish

# ---- Runtime stage ---------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
# curl is used by the container HEALTHCHECK; install before dropping privileges.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
# Run as the non-root user shipped in the .NET images.
USER $APP_UID
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:8080 \
    DOTNET_PRINT_TELEMETRY_MESSAGE=false
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS http://localhost:8080/health || exit 1
ENTRYPOINT ["dotnet", "BazingaComics.Web.dll"]
