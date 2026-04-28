namespace BazingaComics.Api.Entities;

public enum ComicType
{
    PHYSICAL_COPY,
    ONLY_DIGITAL
}

public enum PurchaseType
{
    ORIGINAL,
    DIGITAL
}

public static class EnumParsers
{
    public static ComicType ParseComicType(string? value) =>
        Enum.TryParse<ComicType>(value, ignoreCase: true, out var parsed)
            ? parsed
            : ComicType.PHYSICAL_COPY;

    public static PurchaseType ParsePurchaseType(string? value) =>
        Enum.TryParse<PurchaseType>(value, ignoreCase: true, out var parsed)
            ? parsed
            : PurchaseType.ORIGINAL;
}
