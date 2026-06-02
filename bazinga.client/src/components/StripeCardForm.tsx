import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StripeCardFormProps {
  publishableKey: string;
  clientSecret: string;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (paymentMethodId: string) => void | Promise<void>;
}

const cardElementOptions = {
  style: {
    base: {
      color: "#ffffff",
      fontFamily:
        '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: "15px",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "#7a7a7a" },
      iconColor: "#E50914",
    },
    invalid: { color: "#f87171", iconColor: "#f87171" },
  },
  hidePostalCode: true,
} as const;

const StripeCardFormInner = ({
  clientSecret,
  submitting,
  submitLabel,
  onSubmit,
}: Omit<StripeCardFormProps, "publishableKey">) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const ready = !!stripe && !!elements;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!ready) return;
    const card = elements!.getElement(CardElement);
    if (!card) {
      setError("Card field not loaded yet — try again.");
      return;
    }
    setValidating(true);
    try {
      const result = await stripe!.confirmCardSetup(clientSecret, {
        payment_method: { card },
      });
      if (result.error) {
        setError(result.error.message ?? "Could not validate the card.");
        return;
      }
      const pm = result.setupIntent?.payment_method;
      const pmId = typeof pm === "string" ? pm : pm?.id;
      if (!pmId) {
        setError("Stripe did not return a payment method id.");
        return;
      }
      await onSubmit(pmId);
    } finally {
      setValidating(false);
    }
  };

  const busy = submitting || validating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="h-4 w-4 text-primary" />
          Card details (Stripe)
        </div>
        <div className="rounded-md border border-input bg-background px-3 py-3">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Test mode — use card <code className="text-foreground">4242 4242 4242 4242</code>,
          any future expiry, any CVC. No real charge is ever made.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={!ready || busy} className="w-full h-12 text-base font-bold">
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Validating card…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
};

const StripeCardForm = ({ publishableKey, ...rest }: StripeCardFormProps) => {
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // loadStripe must only run once per key; cached via state.
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  useEffect(() => {
    let cancelled = false;
    stripePromise
      .then((s) => {
        if (cancelled) return;
        if (!s) setLoadError("Stripe failed to load. Check your connection.");
        else setStripeInstance(s);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Stripe failed to load.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [stripePromise]);

  if (loadError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {loadError}
      </p>
    );
  }
  if (!stripeInstance) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading secure card form…
      </div>
    );
  }

  return (
    <Elements stripe={stripeInstance} options={{ clientSecret: rest.clientSecret }}>
      <StripeCardFormInner {...rest} />
    </Elements>
  );
};

export default StripeCardForm;
