import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, CreditCard, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StripeCardForm from "@/components/StripeCardForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import type { BillingIntentResponse } from "@/lib/signup";

const SubscriptionCheckout = () => {
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan") ?? "Comics";
  const billingParam = searchParams.get("billing") ?? "monthly";
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Subscriber name — both halves are required before checkout will fire.
  // Prefill from the account profile so returning subscribers don't retype.
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");

  // Billing intent state — mirrors SignUpComplete's wizard so the checkout
  // form uses the same Stripe Elements path. When Stripe can't be reached
  // the user can fall back to a mock form (no real charge in demo).
  const [billing, setBilling] = useState<BillingIntentResponse | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingReloadKey, setBillingReloadKey] = useState(0);
  const [forceMock, setForceMock] = useState(false);
  const [mockCard, setMockCard] = useState({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  });

  const { planLabel, billingLabel, price } = useMemo(() => {
    const lower = planParam.toLowerCase();
    const normalizedPlan: "Comics" | "TV" | "Unlimited" =
      lower === "tv" ? "TV" : lower === "unlimited" ? "Unlimited" : "Comics";
    const normalizedBilling: "monthly" | "yearly" = billingParam === "yearly" ? "yearly" : "monthly";
    const priceMap = {
      Comics: { monthly: 7.99, yearly: 79.99 },
      TV: { monthly: 9.99, yearly: 99.99 },
      Unlimited: { monthly: 14.99, yearly: 149.99 },
    } as const;
    return {
      planLabel: normalizedPlan,
      billingLabel: normalizedBilling,
      price: priceMap[normalizedPlan][normalizedBilling],
    };
  }, [billingParam, planParam]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [navigate, user]);

  // Pull a fresh Stripe SetupIntent for this signed-in user so the card form
  // can collect a payment method via Stripe Elements before we flip the plan.
  useEffect(() => {
    if (!token || forceMock) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18000);
    setBillingLoading(true);
    setBillingError(null);
    setBilling(null);
    void (async () => {
      try {
        const result = await apiFetch<BillingIntentResponse>(
          "/api/subscriptions/billing-intent",
          {
            method: "POST",
            authToken: token,
            signal: controller.signal,
          }
        );
        if (!cancelled) setBilling(result);
      } catch (err) {
        if (cancelled) return;
        const aborted = err instanceof DOMException && err.name === "AbortError";
        setBillingError(
          aborted
            ? t("subscription.stripeUnreachable")
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
  }, [token, forceMock, billingReloadKey, t]);

  const retryBilling = () => {
    setBillingError(null);
    setBillingReloadKey((k) => k + 1);
  };
  const useMockCard = () => {
    setBillingError(null);
    setForceMock(true);
  };

  /** True when both first and last name are filled — required to subscribe. */
  const nameValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const completeSubscription = async () => {
    if (!token) {
      navigate("/auth");
      return;
    }
    if (!nameValid) {
      toast({
        title: t("subscription.nameRequired"),
        description: t("subscription.nameRequiredBody"),
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);
    try {
      const response = await apiFetch<{
        subscriptionType: string;
        subscriptionExpiration: string | null;
      }>("/api/subscriptions/subscribe", {
        method: "POST",
        authToken: token,
        body: JSON.stringify({
          subscriptionType: planLabel,
          billingCycle: billingLabel,
        }),
      });

      updateUser({
        subscriptionType: response.subscriptionType,
        subscriptionExpiration: response.subscriptionExpiration ?? undefined,
      });

      setOrderComplete(true);
      toast({
        title: t("subscription.activated"),
        description: t("subscription.activatedBody", { plan: response.subscriptionType }),
      });
    } catch (error: unknown) {
      toast({
        title: t("subscription.paymentFailed"),
        description:
          error instanceof Error ? error.message : t("subscription.paymentFailedBody"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeSuccess = async (_paymentMethodId: string) => {
    // Stripe validated the card. In this demo we don't actually charge it;
    // a future revision could attach the payment_method to the customer and
    // open a recurring invoice. The id is intentionally unused for now.
    void _paymentMethodId;
    await completeSubscription();
  };

  const handleMockSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const digits = mockCard.number.replace(/\s/g, "");
    if (!mockCard.name.trim() || digits.length < 12 || !mockCard.expiry || mockCard.cvc.length < 3) {
      toast({
        title: t("subscription.paymentFailed"),
        description: t("subscription.paymentFailedBody"),
        variant: "destructive",
      });
      return;
    }
    await completeSubscription();
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
            <h1 className="text-3xl font-bold mb-4">{t("subscription.complete")}</h1>
            <p className="text-muted-foreground mb-8">
              {t("subscription.completeBody", { plan: planLabel })}
            </p>
            <Link to="/profile">
              <Button variant="default" size="lg">
                {t("subscription.viewProfile").toUpperCase()}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const stripeReady =
    !forceMock &&
    billing &&
    billing.stripeConfigured &&
    billing.publishableKey &&
    billing.clientSecret;
  const showMock = forceMock || (billing && !billing.stripeConfigured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("subscription.back")}
        </button>
        <h1 className="text-3xl font-bold mb-8 uppercase">{t("subscription.checkoutTitle")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-bold mb-4 uppercase">{t("subscription.subscriberDetails")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">{t("account.email")}</Label>
                  <Input id="email" type="email" value={user.email} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    {t("account.firstName")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    autoComplete="given-name"
                    required
                    aria-required="true"
                    aria-invalid={!firstName.trim()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    {t("account.lastName")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    autoComplete="family-name"
                    required
                    aria-required="true"
                    aria-invalid={!lastName.trim()}
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 uppercase">
                <CreditCard className="h-5 w-5" />
                {t("subscription.paymentDetails")}
              </h2>

              {billingLoading && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("subscription.preparingPayment")}
                </div>
              )}

              {billingError && !billingLoading && (
                <div
                  className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 space-y-3"
                  role="alert"
                >
                  <p className="text-sm text-foreground">{billingError}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={retryBilling} className="gap-2">
                      <Loader2 className="h-3.5 w-3.5" />
                      {t("subscription.retryStripe")}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={useMockCard}>
                      {t("subscription.useTestCard")}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("subscription.stripeTip")}
                  </p>
                </div>
              )}

              {!nameValid && (stripeReady || showMock) && (
                <p className="text-xs text-destructive" role="status">
                  {t("subscription.nameRequiredBody")}
                </p>
              )}
              {stripeReady ? (
                <StripeCardForm
                  publishableKey={billing!.publishableKey!}
                  clientSecret={billing!.clientSecret!}
                  submitting={isProcessing}
                  submitLabel={t("subscription.pay", { price: price.toFixed(2) })}
                  onSubmit={handleStripeSuccess}
                />
              ) : showMock ? (
                <form onSubmit={handleMockSubmit} className="space-y-4">
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="card-name">{t("subscription.cardName")}</Label>
                      <Input
                        id="card-name"
                        value={mockCard.name}
                        onChange={(e) => setMockCard({ ...mockCard, name: e.target.value })}
                        placeholder="Roman Bazinga"
                        autoComplete="cc-name"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="card-number">{t("subscription.cardNumber")}</Label>
                      <Input
                        id="card-number"
                        value={mockCard.number}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                          const groups = digits.match(/.{1,4}/g);
                          setMockCard({ ...mockCard, number: groups ? groups.join(" ") : "" });
                        }}
                        placeholder="1234 5678 9012 3456"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="card-expiry">{t("subscription.cardExpiry")}</Label>
                        <Input
                          id="card-expiry"
                          value={mockCard.expiry}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                            const formatted =
                              digits.length > 2
                                ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                                : digits;
                            setMockCard({ ...mockCard, expiry: formatted });
                          }}
                          placeholder="MM/YY"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="card-cvc">{t("subscription.cardCvc")}</Label>
                        <Input
                          id="card-cvc"
                          value={mockCard.cvc}
                          onChange={(e) =>
                            setMockCard({
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
                  <p className="text-[11px] text-muted-foreground">{t("subscription.mockCardNote")}</p>
                  <Button
                    type="submit"
                    disabled={isProcessing || !nameValid}
                    className="w-full h-12 text-base font-bold"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("subscription.processing")}
                      </>
                    ) : (
                      t("subscription.pay", { price: price.toFixed(2) })
                    )}
                  </Button>
                </form>
              ) : null}
            </div>
          </div>

          <div>
            <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4 uppercase">{t("subscription.summary")}</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("account.plan")}</span>
                  <span className="font-medium">{planLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("subscription.billing")}</span>
                  <span className="capitalize">{billingLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("subscription.price")}</span>
                  <span>${price.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("subscription.total")}</span>
                  <span className="text-primary">${price.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {t("subscription.autoRenewNote")}
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
