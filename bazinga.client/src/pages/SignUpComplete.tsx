import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Rocket,
  Sparkles,
  Tv,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  createBillingIntent,
  verifySignupToken,
  type BillingIntentResponse,
  type SignupPlan,
  type SignupVerifyReason,
} from "@/lib/signup";
import {
  subscriptionPlans,
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from "@/data/subscriptionPlans";
import StripeCardForm from "@/components/StripeCardForm";
import heroBanner from "@/assets/hero-banner-1.jpg";

type Step = "welcome" | "password" | "plan" | "card";
type Path = "free" | "paid";

const SignUpComplete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeSignup } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  // --- verification of the magic link --------------------------------------
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [invalidReason, setInvalidReason] = useState<SignupVerifyReason | null>(null);

  // --- wizard state --------------------------------------------------------
  const [step, setStep] = useState<Step>("welcome");
  const [path, setPath] = useState<Path | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [planId, setPlanId] = useState<SubscriptionPlanId>("unlimited");
  const [submitting, setSubmitting] = useState(false);

  // --- billing (lazy: only loaded when we hit the card step) ---------------
  const [billing, setBilling] = useState<BillingIntentResponse | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingReloadKey, setBillingReloadKey] = useState(0);
  // Set when Stripe is unreachable and the user opts to use the test card form.
  const [forceMock, setForceMock] = useState(false);
  // Mock-form state, used when Stripe isn't configured or as a fallback.
  const [mockCard, setMockCard] = useState({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  });

  useEffect(() => {
    document.title = "Finish sign-up · Bazinga";
  }, []);

  useEffect(() => {
    if (!token) {
      setInvalidReason("invalid");
      setVerifying(false);
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
        if (!cancelled) setVerifying(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Fetch the billing intent when we enter the card step (and on retry). A
  // hard timeout means a blocked outbound connection to Stripe surfaces as a
  // clear error instead of an infinite spinner.
  useEffect(() => {
    if (step !== "card" || billing || forceMock) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    setBillingLoading(true);
    setBillingError(null);
    void (async () => {
      try {
        const result = await createBillingIntent(token, controller.signal);
        if (!cancelled) setBilling(result);
      } catch (err) {
        if (cancelled) return;
        const aborted = err instanceof DOMException && err.name === "AbortError";
        setBillingError(
          aborted
            ? "Connecting to Stripe timed out — the server may be unable to reach api.stripe.com."
            : err instanceof Error
              ? err.message
              : "Could not start card collection."
        );
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setBillingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [step, billing, forceMock, token, billingReloadKey]);

  const retryBilling = () => {
    setBillingError(null);
    setBillingReloadKey((k) => k + 1);
  };
  const useMockCard = () => {
    setBillingError(null);
    setForceMock(true);
  };

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

  // ---- step transitions ---------------------------------------------------
  const chooseFreePath = () => {
    setPath("free");
    setStep("password");
  };
  const choosePaidPath = () => {
    setPath("paid");
    setStep("password");
  };

  const handlePasswordContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Use at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Re-enter your password to confirm.",
        variant: "destructive",
      });
      return;
    }
    setStep(path === "paid" ? "plan" : "card");
  };

  const handlePlanContinue = () => setStep("card");

  const back = () => {
    if (step === "password") {
      setStep("welcome");
    } else if (step === "plan") {
      setStep("password");
    } else if (step === "card") {
      setStep(path === "paid" ? "plan" : "password");
    }
  };

  // ---- submit -------------------------------------------------------------
  const finalPlan = useMemo<SignupPlan>(
    () => (path === "paid" ? planId : "trial"),
    [path, planId]
  );

  const submit = async (paymentMethodId: string | null) => {
    setSubmitting(true);
    try {
      await completeSignup(token, password, finalPlan, paymentMethodId);
      const title =
        finalPlan === "trial"
          ? "Your 7-day trial has started"
          : finalPlan === "unlimited"
            ? "Bazinga Unlimited unlocked"
            : finalPlan === "tv"
              ? "Bazinga TV activated"
              : "Bazinga Comics activated";
      toast({ title, description: "Pick a profile to get going." });
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

  const handleMockSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const digits = mockCard.number.replace(/\s/g, "");
    if (!mockCard.name.trim() || digits.length < 12 || !mockCard.expiry || mockCard.cvc.length < 3) {
      toast({
        title: "Card details required",
        description: "All paths require a card on file.",
        variant: "destructive",
      });
      return;
    }
    await submit(null);
  };

  // ---- early-return states ------------------------------------------------
  if (verifying) {
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
      <WizardShell email={null} onLeaveTo="/">
        <div className="max-w-md mx-auto text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/15 grid place-items-center">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{reasonCopy.title}</h1>
          <p className="text-sm text-muted-foreground">{reasonCopy.body}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start over
              </Button>
            </Link>
            <Link to="/auth?mode=signin">
              <Button variant="outline">Sign in instead</Button>
            </Link>
          </div>
        </div>
      </WizardShell>
    );
  }

  // ---- render the current step --------------------------------------------
  return (
    <WizardShell email={email} onLeaveTo={`/signup/check-email?email=${encodeURIComponent(email ?? "")}`}>
      <StepIndicator step={step} path={path} />

      {step === "welcome" && (
        <WelcomeStep onFree={chooseFreePath} onPaid={choosePaidPath} email={email} />
      )}

      {step === "password" && (
        <PasswordStep
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={setPassword}
          onConfirmChange={setConfirmPassword}
          onContinue={handlePasswordContinue}
          onBack={back}
          path={path!}
        />
      )}

      {step === "plan" && (
        <PlanStep
          planId={planId}
          onSelect={setPlanId}
          onContinue={handlePlanContinue}
          onBack={back}
        />
      )}

      {step === "card" && (
        <CardStep
          path={path!}
          finalPlan={finalPlan}
          billing={billing}
          billingLoading={billingLoading}
          billingError={billingError}
          forceMock={forceMock}
          submitting={submitting}
          mockCard={mockCard}
          onMockChange={setMockCard}
          onMockSubmit={handleMockSubmit}
          onStripeSuccess={submit}
          onRetry={retryBilling}
          onUseMock={useMockCard}
          onBack={back}
        />
      )}
    </WizardShell>
  );
};

// =============================================================================
// Shell + step components
// =============================================================================

const WizardShell = ({
  email,
  onLeaveTo,
  children,
}: {
  email: string | null;
  onLeaveTo: string;
  children: React.ReactNode;
}) => (
  <div className="min-h-screen bg-background text-foreground">
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0">
        <img src={heroBanner} alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40" />
      </div>
      <header className="relative z-20">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="text-2xl md:text-3xl font-black tracking-tighter text-primary">
            BAZINGA
          </Link>
          <Link
            to={onLeaveTo}
            className="inline-flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>
      {email && (
        <div className="relative z-10 container mx-auto px-4 md:px-8 pb-8 pt-6 text-center">
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-primary">
            You're almost in
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Setting up <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>
      )}
    </section>
    <main className="container mx-auto px-4 md:px-8 py-10 md:py-14">{children}</main>
  </div>
);

const StepIndicator = ({ step, path }: { step: Step; path: Path | null }) => {
  const labels = path === "paid"
    ? ["Start", "Password", "Plan", "Card"]
    : ["Start", "Password", "Card"];
  const currentIndex = (() => {
    if (step === "welcome") return 0;
    if (step === "password") return 1;
    if (step === "plan") return 2;
    if (step === "card") return path === "paid" ? 3 : 2;
    return 0;
  })();
  return (
    <ol className="max-w-3xl mx-auto mb-8 flex items-center gap-2 md:gap-4 text-xs md:text-sm">
      {labels.map((label, idx) => {
        const done = idx < currentIndex;
        const active = idx === currentIndex;
        return (
          <li key={label} className="flex items-center gap-2 md:gap-3 flex-1">
            <span
              className={cn(
                "grid place-items-center h-6 w-6 md:h-7 md:w-7 rounded-full text-[10px] md:text-xs font-bold shrink-0",
                done
                  ? "bg-primary text-primary-foreground"
                  : active
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
            </span>
            <span className={cn("truncate", active ? "font-semibold" : "text-muted-foreground")}>
              {label}
            </span>
            {idx < labels.length - 1 && (
              <span className="hidden md:block h-px flex-1 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
};

// ----- Welcome ----------------------------------------------------------------

const WelcomeStep = ({
  email,
  onFree,
  onPaid,
}: {
  email: string | null;
  onFree: () => void;
  onPaid: () => void;
}) => (
  <div className="max-w-3xl mx-auto text-center space-y-8">
    <div>
      <h1 className="text-3xl md:text-5xl font-black tracking-tight">
        Welcome to Bazinga{email ? "," : ""}
      </h1>
      {email && (
        <p className="mt-1 text-base md:text-lg text-muted-foreground">{email}</p>
      )}
      <p className="mt-4 text-sm md:text-base text-muted-foreground">
        Try everything for 7 days, or jump straight onto a plan. Both options need a card on file.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <button
        type="button"
        onClick={onFree}
        className="group rounded-xl border-2 border-border bg-card p-6 text-left transition-all hover:border-foreground/40"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md bg-muted text-foreground grid place-items-center shrink-0">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black">Explore for Free</p>
            <p className="text-sm text-muted-foreground mt-1">
              7 days of full Bazinga Unlimited access. Pick a plan before day 7 — we'll never charge without warning.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between text-sm font-semibold">
          <span>Start the 7-day trial</span>
          <span aria-hidden>→</span>
        </div>
      </button>

      <button
        type="button"
        onClick={onPaid}
        className="group relative rounded-xl border-2 border-primary bg-primary/5 p-6 text-left transition-all hover:border-primary/80 shadow-[0_0_30px_hsl(0_82%_55%/0.18)]"
      >
        <span className="absolute -top-2.5 left-6 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
          Recommended
        </span>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md bg-primary text-primary-foreground grid place-items-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black">Join Now</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pick the plan that fits — Comics, BazingaTV or Unlimited — and dive in immediately.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between text-sm font-semibold text-primary">
          <span>Choose your plan</span>
          <span aria-hidden>→</span>
        </div>
      </button>
    </div>
  </div>
);

// ----- Password ---------------------------------------------------------------

const PasswordStep = ({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmChange,
  onContinue,
  onBack,
  path,
}: {
  password: string;
  confirmPassword: string;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onContinue: (e: React.FormEvent) => void;
  onBack: () => void;
  path: Path;
}) => (
  <form onSubmit={onContinue} className="max-w-md mx-auto space-y-6">
    <div>
      <h2 className="text-2xl md:text-3xl font-black tracking-tight">Choose a password</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        You'll use this to sign back in to Bazinga.
        {path === "free"
          ? " After this we'll grab a card so the trial can roll into a plan."
          : " Then you'll pick a plan and link a card."}
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
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="At least 6 characters"
          className="pl-9"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="signup-confirm">Confirm password</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="signup-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => onConfirmChange(e.target.value)}
          placeholder="Repeat your password"
          className="pl-9"
          autoComplete="new-password"
          required
          minLength={6}
        />
      </div>
    </div>

    <div className="flex items-center justify-between gap-3 pt-2">
      <Button type="button" variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button type="submit" className="h-11 px-6 font-bold">
        Continue
      </Button>
    </div>
  </form>
);

// ----- Plan -------------------------------------------------------------------

const planIcon: Record<SubscriptionPlanId, React.ComponentType<{ className?: string }>> = {
  comics: BookOpen,
  tv: Tv,
  unlimited: Sparkles,
};

const PlanStep = ({
  planId,
  onSelect,
  onContinue,
  onBack,
}: {
  planId: SubscriptionPlanId;
  onSelect: (id: SubscriptionPlanId) => void;
  onContinue: () => void;
  onBack: () => void;
}) => (
  <div className="max-w-5xl mx-auto space-y-8">
    <div className="text-center">
      <h2 className="text-2xl md:text-3xl font-black tracking-tight">Choose your universe</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Read the comics, stream the shows, or unlock everything with one Unlimited account.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      {subscriptionPlans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          selected={plan.id === planId}
          onSelect={() => onSelect(plan.id)}
        />
      ))}
    </div>

    <div className="flex items-center justify-between gap-3 max-w-3xl mx-auto">
      <Button type="button" variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button onClick={onContinue} className="h-11 px-6 font-bold">
        Continue to payment
      </Button>
    </div>

    <p className="text-center text-xs text-muted-foreground">
      Cancel anytime in your account. Taxes may apply.
    </p>
  </div>
);

const PlanCard = ({
  plan,
  selected,
  onSelect,
}: {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
}) => {
  const Icon = planIcon[plan.id];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative text-left rounded-xl border-2 p-5 flex flex-col gap-4 transition-all",
        selected
          ? plan.accent === "gradient"
            ? "border-primary bg-primary/5 shadow-[0_0_30px_hsl(0_82%_55%/0.2)]"
            : plan.accent === "orange"
              ? "border-orange-500 bg-orange-500/5"
              : "border-primary bg-primary/5"
          : "border-border bg-card hover:border-foreground/40"
      )}
    >
      {plan.badge && (
        <span
          className={cn(
            "absolute -top-2.5 left-5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white",
            plan.accent === "gradient"
              ? "bg-gradient-to-r from-primary to-orange-500"
              : plan.accent === "orange"
                ? "bg-orange-500 text-black"
                : "bg-primary"
          )}
        >
          {plan.badge}
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-md grid place-items-center shrink-0",
            plan.accent === "gradient"
              ? "bg-gradient-to-r from-primary to-orange-500 text-white"
              : plan.accent === "orange"
                ? "bg-orange-500 text-black"
                : "bg-primary text-primary-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div
          className={cn(
            "h-5 w-5 rounded-full border-2 mt-1 grid place-items-center shrink-0",
            selected
              ? plan.accent === "orange"
                ? "border-orange-500 bg-orange-500"
                : "border-primary bg-primary"
              : "border-muted-foreground/60"
          )}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-background" />}
        </div>
      </div>

      <div>
        <p className="text-lg font-black">{plan.name}</p>
        <p className="text-xs text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black">${plan.monthly.toFixed(2)}</span>
        <span className="text-xs text-muted-foreground">/ month</span>
      </div>

      <ul className="space-y-2 text-sm">
        {plan.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span className="text-foreground/85">{benefit}</span>
          </li>
        ))}
      </ul>
    </button>
  );
};

// ----- Card -------------------------------------------------------------------

const CardStep = ({
  path,
  finalPlan,
  billing,
  billingLoading,
  billingError,
  forceMock,
  submitting,
  mockCard,
  onMockChange,
  onMockSubmit,
  onStripeSuccess,
  onRetry,
  onUseMock,
  onBack,
}: {
  path: Path;
  finalPlan: SignupPlan;
  billing: BillingIntentResponse | null;
  billingLoading: boolean;
  billingError: string | null;
  forceMock: boolean;
  submitting: boolean;
  mockCard: { name: string; number: string; expiry: string; cvc: string };
  onMockChange: (card: { name: string; number: string; expiry: string; cvc: string }) => void;
  onMockSubmit: (e: React.FormEvent) => void;
  onStripeSuccess: (paymentMethodId: string) => Promise<void>;
  onRetry: () => void;
  onUseMock: () => void;
  onBack: () => void;
}) => {
  const summary = useMemo(() => {
    if (finalPlan === "trial") {
      return {
        title: "7-day trial",
        body: "Full Bazinga Unlimited access for 7 days. We'll only charge if you pick a plan before the trial ends.",
        cta: "Start trial and finish sign-up",
      };
    }
    const plan = subscriptionPlans.find((p) => p.id === finalPlan);
    if (!plan) return { title: "Subscription", body: "", cta: "Finish sign-up" };
    return {
      title: `${plan.name} · $${plan.monthly.toFixed(2)}/month`,
      body: plan.tagline,
      cta:
        plan.id === "unlimited"
          ? "Unlock Unlimited and finish sign-up"
          : `Start ${plan.name} and finish sign-up`,
    };
  }, [finalPlan]);

  return (
    <div className="max-w-3xl mx-auto grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <aside className="space-y-4">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">You're getting</p>
          <p className="mt-1 text-lg font-black">{summary.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{summary.body}</p>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Why a card now?</p>
          <p>
            Even the free trial keeps a card on file so we can roll into a plan automatically.
            We'll always email before the first charge.
          </p>
        </div>

        <Button variant="ghost" onClick={onBack} className="gap-2 w-full justify-start">
          <ArrowLeft className="h-4 w-4" />
          Back to {path === "paid" ? "plan" : "password"}
        </Button>
      </aside>

      <div className="space-y-4">
        {billingLoading && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing secure payment…
          </div>
        )}
        {billingError && !billingLoading && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 space-y-3" role="alert">
            <p className="text-sm text-foreground">{billingError}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={onRetry} className="gap-2">
                <Loader2 className="h-3.5 w-3.5" />
                Retry Stripe
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onUseMock}>
                Use test card instead
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tip: this usually means the API host can't reach api.stripe.com. Check the API
              logs for the Stripe error.
            </p>
          </div>
        )}
        {!forceMock &&
        billing &&
        billing.stripeConfigured &&
        billing.publishableKey &&
        billing.clientSecret ? (
          <StripeCardForm
            publishableKey={billing.publishableKey}
            clientSecret={billing.clientSecret}
            submitting={submitting}
            submitLabel={summary.cta}
            onSubmit={(paymentMethodId) => onStripeSuccess(paymentMethodId)}
          />
        ) : forceMock || (billing && !billing.stripeConfigured) ? (
          <form onSubmit={onMockSubmit} className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4 text-primary" />
                Card details
              </div>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="card-name">Name on card</Label>
                  <Input
                    id="card-name"
                    value={mockCard.name}
                    onChange={(e) => onMockChange({ ...mockCard, name: e.target.value })}
                    placeholder="Roman Bazinga"
                    autoComplete="cc-name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="card-number">Card number</Label>
                  <Input
                    id="card-number"
                    value={mockCard.number}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const groups = digits.match(/.{1,4}/g);
                      onMockChange({ ...mockCard, number: groups ? groups.join(" ") : "" });
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
                      value={mockCard.expiry}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                        const formatted =
                          digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                        onMockChange({ ...mockCard, expiry: formatted });
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
                      value={mockCard.cvc}
                      onChange={(e) =>
                        onMockChange({
                          ...mockCard,
                          cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                        })
                      }
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      required
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Mock card form — no real charge is made and details aren't stored. The real
                Stripe Elements form is used when the API can reach Stripe with valid keys.
              </p>
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-bold">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finishing sign-up…
                </>
              ) : (
                summary.cta
              )}
            </Button>
          </form>
        ) : null}

        <p className="text-[11px] text-muted-foreground text-center">
          By continuing you agree to the Bazinga Terms of Use and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default SignUpComplete;
