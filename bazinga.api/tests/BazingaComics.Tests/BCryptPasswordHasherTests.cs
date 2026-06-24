using BazingaComics.Infrastructure.Identity;
using Xunit;

namespace BazingaComics.Tests;

public class BCryptPasswordHasherTests
{
    private readonly BCryptPasswordHasher _hasher = new();

    [Fact]
    public void Hash_Then_Verify_Succeeds()
    {
        var hash = _hasher.Hash("correct horse battery staple");
        Assert.True(_hasher.Verify("correct horse battery staple", hash));
    }

    [Fact]
    public void Verify_Fails_For_Wrong_Password()
    {
        var hash = _hasher.Hash("s3cret");
        Assert.False(_hasher.Verify("not-it", hash));
    }

    [Fact]
    public void Hash_Is_Salted_So_Two_Hashes_Differ()
    {
        Assert.NotEqual(_hasher.Hash("same"), _hasher.Hash("same"));
    }

    [Fact]
    public void Verify_Returns_False_For_Malformed_Hash()
    {
        // The implementation swallows BCrypt's "invalid salt" exception and
        // returns false rather than throwing.
        Assert.False(_hasher.Verify("whatever", "not-a-bcrypt-hash"));
    }
}
