import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { signinVerify } from "@/lib/auth";

/**
 * Landing page for the magic sign-in link emailed by /api/auth/signin/start.
 * Exchanges the URL token for a JWT, populates the AuthContext, then bounces
 * to the profile selector (which is the standard post-login destination).
 */
const SigninVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { consumeSigninToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
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
      .then(() => navigate("/profiles", { replace: true }))
      .catch((err: Error) => setError(err.message || "This sign-in link is no longer valid."));
  }, [consumeSigninToken, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center space-y-4">
        {error ? (
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
