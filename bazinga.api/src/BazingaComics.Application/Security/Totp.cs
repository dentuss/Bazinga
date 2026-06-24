using System.Security.Cryptography;
using System.Text;

namespace BazingaComics.Application.Security;

/// <summary>
/// Self-contained RFC 6238 TOTP (compatible with Google Authenticator, Authy,
/// 1Password, etc.) plus the RFC 4648 base32 codec the secrets are encoded in.
/// Kept dependency-free so we don't add a NuGet package: SHA1 / 6 digits /
/// 30-second period, the defaults every authenticator app assumes.
/// </summary>
public static class Totp
{
    private const int Digits = 6;
    private const int PeriodSeconds = 30;
    private const string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    /// <summary>Generate a random base32 secret (20 bytes → 32 chars by default).</summary>
    public static string GenerateSecret(int bytes = 20) =>
        Base32Encode(RandomNumberGenerator.GetBytes(bytes));

    /// <summary>Build the otpauth:// URI that an authenticator app scans from a QR code.</summary>
    public static string BuildOtpAuthUri(string issuer, string accountName, string secret)
    {
        var label = Uri.EscapeDataString($"{issuer}:{accountName}");
        var iss = Uri.EscapeDataString(issuer);
        return $"otpauth://totp/{label}?secret={secret}&issuer={iss}&algorithm=SHA1&digits={Digits}&period={PeriodSeconds}";
    }

    /// <summary>
    /// Verify a user-supplied code against the secret, allowing ±<paramref name="window"/>
    /// periods of clock drift between the server and the phone.
    /// </summary>
    public static bool Verify(string? secret, string? code, int window = 1)
    {
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(code)) return false;
        code = code.Trim();
        if (code.Length != Digits || !code.All(char.IsDigit)) return false;

        byte[] key;
        try { key = Base32Decode(secret); }
        catch { return false; }

        var counter = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / PeriodSeconds;
        for (var offset = -window; offset <= window; offset++)
        {
            if (FixedTimeEquals(Compute(key, counter + offset), code)) return true;
        }
        return false;
    }

    private static string Compute(byte[] key, long counter)
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
        var otp = binary % (int)Math.Pow(10, Digits);
        return otp.ToString().PadLeft(Digits, '0');
    }

    private static bool FixedTimeEquals(string a, string b) =>
        CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(a), Encoding.ASCII.GetBytes(b));

    public static string Base32Encode(byte[] data)
    {
        var sb = new StringBuilder();
        int buffer = 0, bitsLeft = 0;
        foreach (var b in data)
        {
            buffer = (buffer << 8) | b;
            bitsLeft += 8;
            while (bitsLeft >= 5)
            {
                bitsLeft -= 5;
                sb.Append(Alphabet[(buffer >> bitsLeft) & 31]);
            }
        }
        if (bitsLeft > 0)
        {
            sb.Append(Alphabet[(buffer << (5 - bitsLeft)) & 31]);
        }
        return sb.ToString();
    }

    public static byte[] Base32Decode(string input)
    {
        input = input.Trim().TrimEnd('=').ToUpperInvariant().Replace(" ", "");
        int buffer = 0, bitsLeft = 0;
        var output = new List<byte>(input.Length * 5 / 8);
        foreach (var c in input)
        {
            var idx = Alphabet.IndexOf(c);
            if (idx < 0) throw new FormatException("Invalid base32 character.");
            buffer = (buffer << 5) | idx;
            bitsLeft += 5;
            if (bitsLeft >= 8)
            {
                bitsLeft -= 8;
                output.Add((byte)((buffer >> bitsLeft) & 0xFF));
            }
        }
        return output.ToArray();
    }
}
