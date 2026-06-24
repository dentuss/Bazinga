using System.Security.Cryptography;
using BazingaComics.Application.Security;
using Xunit;

namespace BazingaComics.Tests;

public class TotpTests
{
    // Independent RFC 6238 / RFC 4226 implementation so the test doesn't just
    // mirror the production code — it cross-checks it.
    private static string ComputeCode(byte[] key, long counter)
    {
        var counterBytes = BitConverter.GetBytes(counter);
        if (BitConverter.IsLittleEndian) Array.Reverse(counterBytes);
        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(counterBytes);
        var off = hash[^1] & 0x0F;
        var binary = ((hash[off] & 0x7F) << 24)
                   | ((hash[off + 1] & 0xFF) << 16)
                   | ((hash[off + 2] & 0xFF) << 8)
                   | (hash[off + 3] & 0xFF);
        return (binary % 1_000_000).ToString().PadLeft(6, '0');
    }

    [Fact]
    public void Base32_RoundTrips()
    {
        var bytes = RandomNumberGenerator.GetBytes(20);
        var roundTripped = Totp.Base32Decode(Totp.Base32Encode(bytes));
        Assert.Equal(bytes, roundTripped);
    }

    [Fact]
    public void Base32Decode_Rejects_Invalid_Characters()
    {
        Assert.Throws<FormatException>(() => Totp.Base32Decode("not-base32!"));
    }

    [Fact]
    public void GenerateSecret_Is_Decodable_And_The_Requested_Length()
    {
        var secret = Totp.GenerateSecret(20);
        Assert.Equal(20, Totp.Base32Decode(secret).Length);
    }

    [Fact]
    public void Verify_Accepts_A_Freshly_Computed_Code()
    {
        var secret = Totp.GenerateSecret();
        var key = Totp.Base32Decode(secret);
        var counter = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30;
        var code = ComputeCode(key, counter);

        Assert.True(Totp.Verify(secret, code));
    }

    [Fact]
    public void Verify_Rejects_A_Wrong_Code()
    {
        var secret = Totp.GenerateSecret();
        var key = Totp.Base32Decode(secret);
        var counter = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30;
        var correct = ComputeCode(key, counter);
        // Flip the first digit so it's guaranteed different but still 6 digits.
        var firstDigit = correct[0] == '0' ? '1' : '0';
        var wrong = $"{firstDigit}{correct.Substring(1)}";

        Assert.False(Totp.Verify(secret, wrong));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("12345")]    // too short
    [InlineData("1234567")]  // too long
    [InlineData("12ab56")]   // non-digit
    public void Verify_Rejects_Malformed_Input(string? code)
    {
        Assert.False(Totp.Verify(Totp.GenerateSecret(), code));
    }

    [Fact]
    public void Verify_Returns_False_For_Blank_Secret()
    {
        Assert.False(Totp.Verify(null, "123456"));
        Assert.False(Totp.Verify("", "123456"));
    }
}
