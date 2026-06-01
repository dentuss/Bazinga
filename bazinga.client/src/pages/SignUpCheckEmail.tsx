import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { startSignup } from "@/lib/signup";

const SignUpCheckEmail = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);

  useEffect(() => {
    document.title = "Check your email · Bazinga";
  }, []);

  if (!email) return <Navigate to="/" replace />;

  const handleResend = async () => {
    setResending(true);
    try {
      await startSignup(email, true);
      toast({
        title: "Link sent again",
        description: `We sent another sign-up link to ${email}.`,
      });
    } catch (err) {
      toast({
        title: "Could not resend",
        description: err instanceof Error ? err.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center">
          <Link to="/" className="text-2xl font-black tracking-tighter text-primary">
            BAZINGA
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 pt-16 pb-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/15 grid place-items-center">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                Tap the link in your email
              </h1>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            We sent a sign-up link to the email below. Tap the link to create your account.
          </p>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-foreground truncate">{email}</span>
            <Link
              to="/"
              className="text-xs font-bold uppercase tracking-wider text-foreground underline underline-offset-2 hover:text-primary shrink-0"
            >
              Change
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            Didn't get a link? Check your spam folder, or{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-bold text-foreground underline underline-offset-2 hover:text-primary disabled:opacity-60 disabled:no-underline"
            >
              {resending ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  resending…
                </span>
              ) : (
                "resend it"
              )}
            </button>
            .
          </p>

          <div className="pt-4 flex items-center gap-4">
            <Link
              to="/under-construction"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Get help
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <Link
              to="/auth?mode=signin"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Already have an account? Sign in
            </Link>
          </div>

          <details className="rounded-lg border border-border bg-card/50 p-4 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-semibold text-foreground">
              Developer note
            </summary>
            <p className="mt-2 leading-relaxed">
              In environments where SMTP isn't configured, the sign-up link is written to the API
              logs instead of an email. Look for a line starting with{" "}
              <code className="text-foreground">Email NOT sent</code>.
            </p>
          </details>
        </div>
      </main>
    </div>
  );
};

export default SignUpCheckEmail;
