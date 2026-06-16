namespace BazingaComics.Api.Dtos;

public class ProfileDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string AvatarColor { get; set; } = string.Empty;
    public string? AvatarIcon { get; set; }
    public bool IsRoot { get; set; }
    public bool IsKids { get; set; }
    /// <summary>True when this profile requires a 4-digit PIN before selection.</summary>
    public bool HasPin { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
}

public class ProfileUpsertRequest
{
    public string? Name { get; set; }
    public string? AvatarUrl { get; set; }
    public string? AvatarColor { get; set; }
    public string? AvatarIcon { get; set; }
    public bool? IsKids { get; set; }
}

public class SetPinRequest
{
    /// <summary>The new 4-digit PIN.</summary>
    public string? Pin { get; set; }
    /// <summary>Current PIN — required when replacing an existing one.</summary>
    public string? CurrentPin { get; set; }
}

public class VerifyPinRequest
{
    public string? Pin { get; set; }
}

public class RemovePinRequest
{
    /// <summary>Current PIN — required to remove the lock from your own profile.
    /// The root profile can clear any sub-profile's PIN without it.</summary>
    public string? CurrentPin { get; set; }
}
