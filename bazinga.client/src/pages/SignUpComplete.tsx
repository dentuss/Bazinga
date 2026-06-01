import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, CreditCard, Loader2, Lock, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { verifySignupToken, type SignupPlan, type SignupVerifyReason } from "@/lib/signup";
import heroBanner from "@/assets/hero-banner-1.jpg";
import comic1 from "@/assets/comic-1.jpg";
import comic2 from "@/assets/comic-2.jpg";
import comic3 from "@/assets/comic-3.jpg";
import comic4 from "@/assets/comic-4.jpg";
import comic5 from "@/assets/comic-5.jpg";

const trendingCovers = [comic1, comic2, comic3, comic4, comic5];

const SignUpComplete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeSignup } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [invalidReason, setInvalidReason] = useState<SignupVerifyReason | null>(null);

  const [plan, setPlan] = useState<SignupPlan>("subscribe");
  const [password, setPassword] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Finish sign-up · Bazinga";
  }, []);

  useEffect(() => {
    if (!token) {
      setInvalidReason("invalid");
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const result = await verifySignupToken(token);
        if (cancelled) return;
        if (!result.valid) {
          setInvalidReason((result.reason as SignupVerifyReason) ?? "invalid");
        } else {
          setEmail(result.email ?? null);
        }
      } catch {
        if (!cancelled) setInvalidReason("invalid");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const reasonCopy = useMemo<{ title: string; body: string }>(() => {
    switch (invalidReason) {
      case "expired":
        return {
          title: "This sign-up link has expired",
          body: "Sign-up links expire after 15 minutes. Request a fresh one to continue.",
        };
      case "consumed":
        return {
          title: "This link has already been used",
          body: "If you've already created your account, just sign in.",
        };
      default:
        return {
          title: "We couldn't verify this sign-up link",
          body: "The link may be malformed or no longer exists. Start the sign-up flow again.",
        };
    }
  }, [invalidReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Use at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (!cardName.trim() || cardNumber.replace(/\s/g, "").length < 12 || !cardExpiry || cardCvc.length < 3) {
      toast({
        title: "Card details required",
        description: "Both subscribe and free trial need a card on file.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await completeSignup(token, password, plan);
      toast({
        title: plan === "subscribe" ? "Welcome to Bazinga" : "Your 3-day free trial has started",
        description: "Pick a profile to get going.",
      });
      navigate("/profiles", { replace: true });
    } catch (err) {
      toast({
        title: "Could not finish sign-up",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center text-foreground">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verifying your link…
        </div>
      </div>
    );
  }

  if (invalidReason) {
    return (
      <div className="min-h-screen bg-background flex flex-col text-foreground">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 md:px-8 h-16 flex items-center">
            <Link to="/" className="text-2xl font-black tracking-tighter text-primary">
              BAZINGA
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md text-center space-y-5">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/15 grid place-items-center">
              <XCircle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{reasonCopy.title}</h1>
            <p className="text-sm text-muted-foreground">{reasonCopy.body}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/">
                <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Start over
                </Button>
              </Link>
              <Link to="/auth?mode=signin">
                <Button variant="outline">Sign in instead</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(0_82%_55%_/_0.25),_transparent_70%)]" />
        </div>
        <header className="relative z-20">
          <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="text-2xl md:text-3xl font-black tracking-tighter text-primary">
              BAZINGA
            </Link>
            <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">
              Signed up as <span className="font-semibold text-foreground">{email}</span>
            </span>
          </div>
        </header>

        <div className="relative z-10 container mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-10 text-center">
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-primary">
            You're almost in
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl lg:text-6xl font-black tracking-tight max-w-3xl mx-auto leading-tight">
            Unlimited comics, series and more.
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Starts at €4.99/month. Cancel anytime.
          </p>
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-8 pb-12">
          <div className="flex justify-center gap-3 overflow-hidden">
            {trendingCovers.map((src, idx) => (
              <div
                key={idx}
                className="hidden md:block w-28 lg:w-36 shrink-0 rounded-md overflow-hidden shadow-xl"
                style={{ transform: `translateY(${idx % 2 === 0 ? "0" : "16px"})` }}
              >
                <img src={src} alt="" className="w-full aspect-[2/3] object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <main className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_1fr]"
        >
          {/* Plan choice */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">Choose your plan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Both options need a card on file. Cancel anytime in your account settings.
              </p>
            </div>

            <PlanCard
              selected={plan === "subscribe"}
              onSelect={() => setPlan("subscribe")}
              accent="red"
              recommended
              icon={<Sparkles className="h-5 w-5" />}
              title="Subscribe now"
              price="€4.99/month"
              description="Charged today. Full access immediately — comics, BazingaTV and downloads."
            />

            <PlanCard
              selected={plan === "trial"}
              onSelect={() => setPlan("trial")}
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Start a 3-day free trial"
              price="Free for 3 days, then €4.99/month"
              description="No charge for the first 3 days. We'll bill your card when the trial ends — cancel before then to avoid it."
            />
          </section>

          {/* Password + card */}
          <section className="space-y-5">
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">Set up your account</h2>
              <p className="text-sm text-muted-foreground mt-1">
                One last thing — set a password and link your card.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment method
              </div>
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="card-name">Name on card</Label>
                  <Input
                    id="card-name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Roman Bazinga"
                    autoComplete="cc-name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="card-number">Card number</Label>
                  <Input
                    id="card-number"
                    value={cardNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const groups = digits.match(/.{1,4}/g);
                      setCardNumber(groups ? groups.join(" ") : "");
                    }}
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="card-expiry">Expiry</Label>
                    <Input
                      id="card-expiry"
                      value={cardExpiry}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                        const formatted =
                          digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                        setCardExpiry(formatted);
                      }}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="card-cvc">CVC</Label>
                    <Input
                      id="card-cvc"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      required
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Demo only — no real charge is made and card details are not stored.
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className={cn(
                "w-full h-12 text-base font-bold",
                plan === "subscribe"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-orange-500 text-black hover:bg-orange-500/90"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finishing sign-up…
                </>
              ) : plan === "subscribe" ? (
                "Subscribe and finish sign-up"
              ) : (
                "Start free trial and finish sign-up"
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center">
              By continuing you agree to the Bazinga Terms of Use and Privacy Policy.
            </p>
          </section>
        </form>
      </main>
    </div>
  );
};

interface PlanCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: string;
  description: string;
  icon: React.ReactNode;
  accent?: "red" | "neutral";
  recommended?: boolean;
}

const PlanCard = ({
  selected,
  onSelect,
  title,
  price,
  description,
  icon,
  accent = "neutral",
  recommended,
}: PlanCardProps) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={cn(
      "relative w-full text-left rounded-xl border-2 p-5 transition-all",
      selected
        ? accent === "red"
          ? "border-primary bg-primary/5 shadow-[0_0_30px_hsl(0_82%_55%/0.18)]"
          : "border-foreground bg-foreground/5"
        : "border-border bg-card hover:border-foreground/40"
    )}
  >
    {recommended && (
      <span className="absolute -top-2.5 left-5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
        Most popular
      </span>
    )}
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "h-9 w-9 rounded-md grid place-items-center shrink-0",
          selected && accent === "red"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-foreground">{title}</p>
        </div>
        <p className="text-sm font-semibold text-primary mt-0.5">{price}</p>
        <p className="text-sm text-muted-foreground mt-2 leading-snug">{description}</p>
      </div>
      <div
        className={cn(
          "h-5 w-5 rounded-full border-2 shrink-0 mt-1 grid place-items-center",
          selected
            ? accent === "red"
              ? "border-primary bg-primary"
              : "border-foreground bg-foreground"
            : "border-muted-foreground/60"
        )}
      >
        {selected && (
          <span className="h-2 w-2 rounded-full bg-background" />
        )}
      </div>
    </div>
  </button>
);

export default SignUpComplete;
