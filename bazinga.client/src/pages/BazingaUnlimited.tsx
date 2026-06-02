import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Tv, Sparkles, Check, ShieldAlert } from "lucide-react";

type Plan = {
  id: "Comics" | "TV" | "Unlimited";
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  benefits: string[];
  accentBorder: string;
  accentText: string;
  accentBg: string;
  icon: typeof BookOpen;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    id: "Comics",
    name: "Bazinga Comics",
    tagline: "Read every issue, every series.",
    monthly: 7.99,
    yearly: 79.99,
    benefits: [
      "Unlimited reading on Bazinga Comics",
      "Every series, every issue — past and future",
      "Offline downloads on phone and tablet",
      "Early access drops every Wednesday",
    ],
    accentBorder: "border-primary",
    accentText: "text-primary",
    accentBg: "bg-primary",
    icon: BookOpen,
  },
  {
    id: "TV",
    name: "Bazinga TV",
    tagline: "Stream the multiverse, episode by episode.",
    monthly: 9.99,
    yearly: 99.99,
    benefits: [
      "Unlimited streaming on BazingaTV",
      "Animated series, live action and anime",
      "4K + HDR on supported devices",
      "Watch on TV, web, phone and tablet",
    ],
    accentBorder: "border-orange-500",
    accentText: "text-orange-500",
    accentBg: "bg-orange-500",
    icon: Tv,
  },
  {
    id: "Unlimited",
    name: "Bazinga Unlimited",
    tagline: "Both worlds. One subscription.",
    monthly: 14.99,
    yearly: 149.99,
    benefits: [
      "Everything in Bazinga Comics",
      "Everything in Bazinga TV",
      "Exclusive Unlimited-only drops and previews",
      "One account, two universes — save 23%",
    ],
    accentBorder: "border-transparent",
    accentText: "text-white",
    accentBg: "bg-gradient-to-r from-primary to-orange-500",
    icon: Sparkles,
    highlight: true,
  },
];

const BazingaUnlimited = () => {
  const { user, trialExpired } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const fromTrialExpired = searchParams.get("from") === "trial-expired" || trialExpired;

  const handleSubscribe = (plan: Plan["id"], billingCycle: "monthly" | "yearly") => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (user.role && user.role !== "USER") {
      toast({
        title: "Subscription unavailable",
        description: "Subscriptions are only available for standard user accounts.",
        variant: "destructive",
      });
      return;
    }

    navigate(`/subscription-checkout?plan=${encodeURIComponent(plan)}&billing=${billingCycle}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        {!fromTrialExpired && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {fromTrialExpired && (
          <div className="max-w-3xl mx-auto mb-10 rounded-xl border-2 border-orange-500/50 bg-orange-500/10 p-5 flex items-start gap-4">
            <ShieldAlert className="h-6 w-6 text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-foreground">Your 7-day trial has ended</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a plan below to keep reading and watching. Your account, profiles and viewing
                history stay exactly where you left them.
              </p>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            Bazinga Subscriptions
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Choose your universe</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Read the comics, stream the shows, or unlock everything with one Unlimited account.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 ${plan.accentBorder} bg-card p-8 shadow-sm flex flex-col ${
                  plan.highlight
                    ? "lg:scale-[1.04] shadow-[0_0_60px_hsl(var(--shadow-glow))] ring-2 ring-transparent bg-gradient-to-b from-card via-card to-card"
                    : ""
                }`}
                style={
                  plan.highlight
                    ? {
                        backgroundImage:
                          "linear-gradient(hsl(var(--card)),hsl(var(--card))), linear-gradient(to right, hsl(var(--primary)), hsl(25 95% 55%))",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box",
                      }
                    : undefined
                }
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.3em] bg-gradient-to-r from-primary to-orange-500 text-white rounded-full px-3 py-1">
                    Best Value
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span
                    className={`grid place-items-center h-10 w-10 rounded-lg ${plan.accentBg} ${
                      plan.id === "TV" ? "text-black" : "text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className={`text-2xl font-bold ${plan.accentText}`}>{plan.name}</h2>
                    <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                  </div>
                </div>

                <p className="mt-6 text-sm text-muted-foreground">
                  <span className={`text-3xl font-black ${plan.accentText}`}>${plan.monthly.toFixed(2)}</span>
                  <span className="ml-1">/ month</span>
                </p>
                <p className="text-xs text-muted-foreground">or ${plan.yearly.toFixed(2)} / year</p>

                <ul className="mt-6 space-y-3 text-sm text-foreground/85 flex-1">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-2">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.accentText}`} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 grid gap-3">
                  <Button
                    size="lg"
                    className={`w-full text-white font-bold ${
                      plan.id === "TV"
                        ? "bg-orange-500 hover:bg-orange-600 text-black"
                        : plan.id === "Comics"
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-gradient-to-r from-primary to-orange-500 hover:opacity-90"
                    }`}
                    onClick={() => handleSubscribe(plan.id, "monthly")}
                  >
                    Subscribe Monthly
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className={`w-full border-2 ${plan.accentBorder} ${plan.accentText}`}
                    onClick={() => handleSubscribe(plan.id, "yearly")}
                  >
                    Subscribe Yearly
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Cancel anytime. Taxes may apply.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default BazingaUnlimited;
