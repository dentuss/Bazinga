using BazingaComics.Application.Security;
using Xunit;

namespace BazingaComics.Tests;

public class SignupTokensTests
{
    [Fact]
    public void Hash_Is_Deterministic()
    {
        Assert.Equal(SignupTokens.Hash("hello"), SignupTokens.Hash("hello"));
    }

    [Fact]
    public void Hash_Matches_Known_Sha256_Hex()
    {
        // SHA-256("abc") — fixed, uppercase hex (Convert.ToHexString).
        Assert.Equal(
            "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD",
            SignupTokens.Hash("abc"));
    }

    [Fact]
    public void Hash_Differs_For_Different_Input()
    {
        Assert.NotEqual(SignupTokens.Hash("a"), SignupTokens.Hash("b"));
    }

    [Fact]
    public void Generate_Is_Url_Safe()
    {
        for (var i = 0; i < 50; i++)
        {
            var token = SignupTokens.Generate();
            Assert.DoesNotContain('+', token);
            Assert.DoesNotContain('/', token);
            Assert.DoesNotContain('=', token);
            Assert.NotEqual(0, token.Length);
        }
    }

    [Fact]
    public void Generate_Produces_Unique_Tokens()
    {
        var tokens = Enumerable.Range(0, 100).Select(_ => SignupTokens.Generate()).ToHashSet();
        Assert.Equal(100, tokens.Count);
    }
}
