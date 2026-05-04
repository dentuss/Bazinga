FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY BazingaComics.sln ./
COPY BazingaComics.Api/BazingaComics.Api.csproj BazingaComics.Api/
COPY BazingaComics.Tests/BazingaComics.Tests.csproj BazingaComics.Tests/
RUN dotnet restore BazingaComics.sln
COPY . .
RUN dotnet publish BazingaComics.Api/BazingaComics.Api.csproj \
        -c Release \
        --no-restore \
        -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:8080 \
    DOTNET_PRINT_TELEMETRY_MESSAGE=false
EXPOSE 8080
ENTRYPOINT ["dotnet", "BazingaComics.Api.dll"]
