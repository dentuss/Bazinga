import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Check, CreditCard } from "lucide-react";

const SubscriptionCheckout = () => {
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan") ?? "Premium";
  const billingParam = searchParams.get("billing") ?? "monthly";
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const { planLabel, billingLabel, price } = useMemo(() => {
    const normalizedPlan = planParam.toLowerCase() === "unlimited" ? "Unlimited" : "Premium";
    const normalizedBilling = billingParam === "yearly" ? "yearly" : "monthly";
    const priceMap = {
      Premium: { monthly: 4.99, yearly: 49.99 },
      Unlimited: { monthly: 14.99, yearly: 159.99 },
    };
    return {
      planLabel: normalizedPlan,
      billingLabel: normalizedBilling,
      price: priceMap[normalizedPlan as "Premium" | "Unlimited"][normalizedBilling as "monthly" | "yearly"],
    };
  }, [billingParam, planParam]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [navigate, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      navigate("/auth");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await apiFetch<{ subscriptionType: string; subscriptionExpiration: string | null }>(
        "/api/subscriptions/subscribe",
        {
          method: "POST",
          authToken: token,
          body: JSON.stringify({
            subscriptionType: planLabel,
            billingCycle: billingLabel,
          }),
        }
      );

      updateUser({
        subscriptionType: response.subscriptionType,
        subscriptionExpiration: response.subscriptionExpiration ?? undefined,
      });

      setOrderComplete(true);
      toast({
        title: "Subscription activated",
        description: `You're now subscribed to Bazinga ${response.subscriptionType}.`,
      });
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error?.message || "We couldn't process your subscription right now.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return null;
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Subscription Complete!</h1>
            <p className="text-muted-foreground mb-8">
              Your Bazinga {planLabel} plan is now active. Enjoy your benefits and start reading.
            </p>
            <Link to="/profile">
              <Button variant="default" size="lg">
                VIEW PROFILE
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">SUBSCRIPTION CHECKOUT</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-bold mb-4">SUBSCRIBER DETAILS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user.email} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" required />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                PAYMENT DETAILS
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" required />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" variant="default" size="lg" className="w-full" disabled={isProcessing}>
              {isProcessing ? "PROCESSING..." : `PAY $${price.toFixed(2)}`}
            </Button>
          </form>

          <div>
            <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">SUBSCRIPTION SUMMARY</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{planLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billing</span>
                  <span className="capitalize">{billingLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span>${price.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${price.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                By subscribing, you agree to automatic renewal unless canceled before the renewal date.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionCheckout;
