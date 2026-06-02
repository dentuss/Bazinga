import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Sparkles,
  XCircle,
} from "lucide-react";
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

type PlanOption = {
  id: SignupPlan;
  name: string;
  tagline: string;
  monthly: number;
  benefits: string[];
  icon: typeof BookOpen;
  badge?: string;
  highlight?: boolean;
};

const planOptions: PlanOption[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Sample the universe.",
    monthly: 0,
    icon: BookOpen,
    benefits: [
      "Browse the full Bazinga catalog",
      "Read sample issues every week",
      "No card required, no commitment",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Read everything, save on the rest.",
    monthly: 4.99,
    icon: Sparkles,
    badge: "Most popular",
    highlight: true,
    benefits: [
      "Unlimited reading on Bazinga Comics",
      "25% off every physical and digital comic",
      "Offline downloads on phone and tablet",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    tagline: "Both worlds, one subscription.",
    monthly: 14.99,
    icon: Sparkles,
    badge: "Best value",
    benefits: [
      "Everything in Premium",
      "Unlimited BazingaTV streaming in 4K HDR",
      "Exclusive Unlimited-only drops and previews",
    ],
  },
];

const planRequiresCard = (plan: SignupPlan) => plan !== "free";

const SignUpComplete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeSignup } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [invalidReason, setInvalidReason] = useState<SignupVerifyReason | null>(null);

  const [plan, setPlan] = useState<SignupPlan>("premium");
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

  const selectedPlan = planOptions.find((p) => p.id === plan) ?? planOptions[1];
  const cardRequired = planRequiresCard(plan);

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
    if (cardRequired) {
      const digits = cardNumber.replace(/\s/g, "");
      if (!cardName.trim() || digits.length < 12 || !cardExpiry || cardCvc.length < 3) {
        toast({
          title: "Card details required",
          description: "Paid plans need a card on file.",
          variant: "destructive",
        });
        return;
      }
    }
    setSubmitting(true);
    try {
      await completeSignup(token, password, plan);
      toast({
        title:
          plan === "free"
            ? "Welcome to Bazinga"
            : plan === "unlimited"
              ? "Bazinga Unlimited unlocked"
              : "Bazinga Premium activated",
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
            Pick the plan that fits.
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Start free, upgrade anytime. Paid plans renew monthly — cancel from your account.
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
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-10">
          {/* Plan grid */}
          <section>
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-black tracking-tight">Choose your plan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                You can change plans anytime from your account.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {planOptions.map((option) => (
                <PlanCard
                  key={option.id}
                  option={option}
                  selected={plan === option.id}
                  onSelect={() => setPlan(option.id)}
                />
              ))}
            </div>
          </section>

          {/* Password + card */}
          <section className="grid gap-6 lg:grid-cols-2 max-w-3xl mx-auto">
            <div className="space-y-5">
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">Set up your account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Set a password so you can sign back in later.
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
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div
                className={cn(
                  "rounded-lg border p-3 text-sm flex items-start gap-3 transition-colors",
                  cardRequired
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-border bg-muted/40 text-muted-foreground"
                )}
              >
                <selectedPlan.icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold">
                    {selectedPlan.name} ·{" "}
                    {selectedPlan.monthly === 0 ? "Free forever" : `€${selectedPlan.monthly.toFixed(2)}/month`}
                  </p>
                  <p className="text-xs mt-0.5">{selectedPlan.tagline}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {cardRequired ? (
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
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                  <CreditCard className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="mt-2 font-semibold">No card needed</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Free plan members can read sample issues right away. Upgrade anytime from your account.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className={cn(
                  "w-full h-12 text-base font-bold",
                  plan === "unlimited"
                    ? "bg-gradient-to-r from-primary to-orange-500 text-white hover:opacity-90"
                    : plan === "premium"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-foreground text-background hover:bg-foreground/90"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finishing sign-up…
                  </>
                ) : plan === "free" ? (
                  "Create my free account"
                ) : plan === "unlimited" ? (
                  "Unlock Unlimited and finish sign-up"
                ) : (
                  "Start Premium and finish sign-up"
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                By continuing you agree to the Bazinga Terms of Use and Privacy Policy.
              </p>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
};

interface PlanCardProps {
  option: PlanOption;
  selected: boolean;
  onSelect: () => void;
}

const PlanCard = ({ option, selected, onSelect }: PlanCardProps) => {
  const Icon = option.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative text-left rounded-xl border-2 p-5 flex flex-col gap-4 transition-all",
        selected
          ? option.highlight
            ? "border-primary bg-primary/5 shadow-[0_0_30px_hsl(0_82%_55%/0.2)]"
            : option.id === "unlimited"
              ? "border-orange-500 bg-orange-500/5"
              : "border-foreground bg-foreground/5"
          : "border-border bg-card hover:border-foreground/40"
      )}
    >
      {option.badge && (
        <span
          className={cn(
            "absolute -top-2.5 left-5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
            option.id === "unlimited"
              ? "bg-orange-500 text-black"
              : "bg-primary text-primary-foreground"
          )}
        >
          {option.badge}
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-md grid place-items-center shrink-0",
            option.id === "unlimited"
              ? "bg-gradient-to-r from-primary to-orange-500 text-white"
              : option.id === "premium"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div
          className={cn(
            "h-5 w-5 rounded-full border-2 mt-1 grid place-items-center shrink-0",
            selected
              ? option.id === "unlimited"
                ? "border-orange-500 bg-orange-500"
                : "border-primary bg-primary"
              : "border-muted-foreground/60"
          )}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-background" />}
        </div>
      </div>

      <div>
        <p className="text-lg font-black">{option.name}</p>
        <p className="text-xs text-muted-foreground">{option.tagline}</p>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black">
          {option.monthly === 0 ? "€0" : `€${option.monthly.toFixed(2)}`}
        </span>
        <span className="text-xs text-muted-foreground">
          {option.monthly === 0 ? "forever" : "/ month"}
        </span>
      </div>

      <ul className="space-y-2 text-sm">
        {option.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span className="text-foreground/85">{benefit}</span>
          </li>
        ))}
      </ul>
    </button>
  );
};

export default SignUpComplete;
