import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, KeyRound, Loader2, Lock, Mail, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CodeInput from "@/components/CodeInput";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { signinStart } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mode = "magic" | "password";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("magic");
  const [helpOpen, setHelpOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState("");
  // 2FA step (after a correct password for a 2FA-enabled account)
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Sign in · Bazinga";
  }, []);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }
    setSending(true);
    try {
      await signinStart(cleanEmail);
      setSent(cleanEmail);
    } catch {
      // Server returns 204 even on miss — only network errors land here.
      setError("Could not send the sign-in link. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const outcome = await login(email.trim(), password);
      if (outcome.twoFactorRequired && outcome.challengeToken) {
        setChallenge(outcome.challengeToken);
        setCode("");
        return;
      }
      navigate("/profiles");
    } catch {
      setError("Authentication failed. Please check your details.");
    }
  };

  const handleVerifyCode = async (value: string) => {
    if (!challenge || value.length !== 6) return;
    setVerifying(true);
    setError("");
    try {
      await verifyTwoFactor(challenge, value);
      navigate("/profiles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect code.");
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4">
          <Link
            to="/"
            className="text-2xl font-black tracking-tighter text-primary hover:text-primary/90 transition-colors"
          >
            BAZINGA
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-foreground mb-2">WELCOME BACK</h1>
              <p className="text-muted-foreground">
                {mode === "magic"
                  ? "We'll email you a one-tap sign-in link."
                  : "Sign in with your password."}
              </p>
            </div>

            {challenge ? (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 grid place-items-center">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator app.
                  </p>
                </div>
                <CodeInput
                  value={code}
                  onChange={setCode}
                  onComplete={handleVerifyCode}
                  autoFocus
                  disabled={verifying}
                  error={Boolean(error)}
                />
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleVerifyCode(code)}
                  disabled={verifying || code.length !== 6}
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Verify code
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setChallenge(null);
                    setCode("");
                    setError("");
                  }}
                  className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Back to sign in
                </button>
              </div>
            ) : sent ? (
              <CheckYourEmail email={sent} onBack={() => setSent(null)} />
            ) : mode === "magic" ? (
              <form onSubmit={handleMagicLink} className="space-y-6">
                <EmailField email={email} setEmail={setEmail} />
                <Button type="submit" className="w-full" size="lg" disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {sending ? "Sending link…" : "Email me a sign-in link"}
                </Button>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <EmailField email={email} setEmail={setEmail} />
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-semibold">
                    PASSWORD
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-background border-border"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  SIGN IN
                </Button>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              </form>
            )}

            {/* Get help dropdown — hidden during the "check email" and 2FA steps. */}
            {!sent && !challenge && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setHelpOpen((o) => !o)}
                  className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={helpOpen}
                >
                  Get help
                  <ChevronDown className={cn("h-4 w-4 transition-transform", helpOpen && "rotate-180")} />
                </button>

                {helpOpen && (
                  <div className="mt-3 rounded-lg border border-border bg-background/40 divide-y divide-border overflow-hidden">
                    <HelpOption
                      icon={<Lock className="h-4 w-4" />}
                      label="Sign in using password"
                      active={mode === "password"}
                      onClick={() => {
                        setMode((m) => (m === "password" ? "magic" : "password"));
                        setError("");
                      }}
                      hint={mode === "password" ? "Switch back to email link" : undefined}
                    />
                    <HelpOption
                      icon={<ShieldCheck className="h-4 w-4" />}
                      label="Sign in using 2FA"
                      onClick={() =>
                        toast({
                          title: "Two-factor is automatic",
                          description:
                            "If 2FA is on for your account, we'll ask for your authenticator code right after you sign in.",
                        })
                      }
                    />
                    <HelpOption
                      icon={<KeyRound className="h-4 w-4" />}
                      label="Don't have access to my email"
                      onClick={() => toast({ title: "Coming soon", description: "Account recovery without email isn't available yet." })}
                      hint="Coming soon"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/" className="text-primary font-semibold hover:underline">
                  Get started
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <Link
                to="/"
                className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const EmailField = ({ email, setEmail }: { email: string; setEmail: (v: string) => void }) => (
  <div className="space-y-2">
    <Label htmlFor="email" className="text-foreground font-semibold">
      EMAIL ADDRESS
    </Label>
    <div className="relative">
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        id="email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="pl-10 bg-background border-border"
        autoComplete="email"
        required
      />
    </div>
  </div>
);

const HelpOption = ({
  icon,
  label,
  active,
  onClick,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  hint?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors",
      active ? "text-primary bg-primary/10" : "text-foreground hover:bg-muted/60"
    )}
  >
    <span className={cn(active ? "text-primary" : "text-muted-foreground")}>{icon}</span>
    <span className="flex-1">{label}</span>
    {hint && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{hint}</span>}
  </button>
);

const CheckYourEmail = ({ email, onBack }: { email: string; onBack: () => void }) => (
  <div className="text-center space-y-4">
    <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 grid place-items-center">
      <Mail className="h-6 w-6 text-primary" />
    </div>
    <h2 className="text-xl font-black">Check your email</h2>
    <p className="text-sm text-muted-foreground">
      If an account exists for{" "}
      <span className="font-semibold text-foreground">{email}</span>, we just sent a sign-in link.
      It expires in 15 minutes and can only be used once.
    </p>
    <Button variant="outline" onClick={onBack} className="gap-2">
      <X className="h-4 w-4" />
      Use a different email
    </Button>
  </div>
);

export default Auth;
