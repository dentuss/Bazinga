import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Bazinga Premium",
    accent: "border-orange-500",
    accentText: "text-orange-500",
    monthly: 4.99,
    yearly: 49.99,
    benefits: [
      "35% discount for all the physical copies of the comics",
      "50% discount for the digital copies",
    ],
  },
  {
    name: "Bazinga Unlimited",
    accent: "border-red-500",
    accentText: "text-red-500",
    monthly: 14.99,
    yearly: 159.99,
    benefits: [
      "50% discount for all the physical copies of the comics",
      "Unlimited access to the digital copies",
    ],
  },
];

const BazingaUnlimited = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubscribe = (plan: string, billingCycle: "monthly" | "yearly") => {
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
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Bazinga Unlimited</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Choose your subscription</h1>
          <p className="text-muted-foreground">
            Unlock exclusive pricing on physical comics and expand your digital reading experience.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl border-2 ${plan.accent} bg-card p-8 shadow-sm`}>
              <div className="space-y-3">
                <h2 className={`text-2xl font-bold ${plan.accentText}`}>{plan.name}</h2>
                <p className="text-muted-foreground">
                  ${plan.monthly.toFixed(2)} / month or ${plan.yearly.toFixed(2)} / year
                </p>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {plan.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-2">
                    <span className={`mt-1 h-2 w-2 rounded-full ${plan.accentText.replace("text", "bg")}`} />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 grid gap-3">
                <Button
                  size="lg"
                  className={`w-full ${plan.name === "Bazinga Unlimited" ? "bg-red-600 hover:bg-red-700" : "bg-orange-500 hover:bg-orange-600"} text-white`}
                  onClick={() => handleSubscribe(plan.name.includes("Premium") ? "Premium" : "Unlimited", "monthly")}
                >
                  Subscribe Monthly
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className={`w-full border-2 ${plan.accent} ${plan.accentText}`}
                  onClick={() => handleSubscribe(plan.name.includes("Premium") ? "Premium" : "Unlimited", "yearly")}
                >
                  Subscribe Yearly
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BazingaUnlimited;
