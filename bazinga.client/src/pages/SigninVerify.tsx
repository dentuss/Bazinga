import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput";
import { useAuth } from "@/contexts/AuthContext";
import { signinVerify } from "@/lib/auth";

/**
 * Landing page for the magic sign-in link emailed by /api/auth/signin/start.
 * Exchanges the URL token for a JWT (or a 2FA challenge), then bounces to the
 * profile selector once the session is complete.
 */
const SigninVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { consumeSigninToken, verifyTwoFactor } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  // StrictMode fires effects twice in dev — only run the one-shot verify once.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = searchParams.get("token");
    if (!token) {
      setError("This sign-in link is missing its token.");
      return;
    }
    consumeSigninToken(() => signinVerify(token))
      .then((outcome) => {
        if (outcome.twoFactorRequired && outcome.challengeToken) {
          setChallenge(outcome.challengeToken);
        } else {
          navigate("/profiles", { replace: true });
        }
      })
      .catch((err: Error) => setError(err.message || "This sign-in link is no longer valid."));
  }, [consumeSigninToken, navigate, searchParams]);

  const handleVerify = async (value: string) => {
    if (!challenge || value.length !== 6) return;
    setVerifying(true);
    setError(null);
    try {
      await verifyTwoFactor(challenge, value);
      navigate("/profiles", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect code.");
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center space-y-4">
        {error && !challenge ? (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/15 grid place-items-center">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-2xl font-black">Sign-in link expired</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link to="/auth">
              <Button className="w-full">Request a new link</Button>
            </Link>
          </>
        ) : challenge ? (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 grid place-items-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-black">Two-factor verification</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app.
            </p>
            <CodeInput
              value={code}
              onChange={setCode}
              onComplete={handleVerify}
              autoFocus
              disabled={verifying}
              error={Boolean(error)}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              className="w-full"
              onClick={() => handleVerify(code)}
              disabled={verifying || code.length !== 6}
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify code
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-black">Signing you in…</h1>
            <p className="text-sm text-muted-foreground">Hold on — we're exchanging your link for a session.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SigninVerify;
