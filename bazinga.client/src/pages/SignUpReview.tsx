import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { startSignup } from "@/lib/signup";

const SignUpReview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [optOut, setOptOut] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Review to continue · Bazinga";
  }, []);

  if (!email) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await startSignup(email, optOut);
      navigate(`/signup/check-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send the sign-up link.";
      if (message.toLowerCase().includes("already exists")) {
        toast({
          title: "Account already exists",
          description: "Please sign in instead.",
        });
        navigate(`/auth?mode=signin&email=${encodeURIComponent(email)}`);
        return;
      }
      toast({ title: "Could not continue", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
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
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-6"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Review to continue</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll send a sign-up link to this email — make sure it's the one you want.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-foreground truncate">{email}</span>
            <Link
              to="/"
              className="text-xs font-bold uppercase tracking-wider text-foreground underline underline-offset-2 hover:text-primary shrink-0"
            >
              Change
            </Link>
          </div>

          <Label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={optOut}
              onCheckedChange={(v) => setOptOut(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed">
              Please do not email me about Bazinga special offers.
            </span>
          </Label>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending link…
              </>
            ) : (
              "Continue"
            )}
          </Button>

          <div className="pt-4">
            <Link
              to="/under-construction"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Get help
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SignUpReview;
