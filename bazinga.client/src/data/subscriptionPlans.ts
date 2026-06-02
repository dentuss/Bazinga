export type SubscriptionPlanId = "comics" | "tv" | "unlimited";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  benefits: string[];
  accent: "red" | "orange" | "gradient";
  badge?: string;
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "comics",
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
    accent: "red",
  },
  {
    id: "tv",
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
    accent: "orange",
  },
  {
    id: "unlimited",
    name: "Bazinga Unlimited",
    tagline: "Both worlds, one subscription.",
    monthly: 14.99,
    yearly: 149.99,
    benefits: [
      "Everything in Bazinga Comics",
      "Everything in Bazinga TV",
      "Exclusive Unlimited-only drops and previews",
      "One account, two universes — save 23%",
    ],
    accent: "gradient",
    badge: "Best value",
  },
];

export const getSubscriptionPlan = (id: SubscriptionPlanId): SubscriptionPlan =>
  subscriptionPlans.find((p) => p.id === id) ?? subscriptionPlans[2];

/** SubscriptionType values produced by `/api/auth/signup/complete`. */
export const PAID_SUBSCRIPTION_TYPES = ["Comics", "TV", "Unlimited"] as const;

/**
 * Whether the user currently has a paid, non-trial subscription (used by the
 * header to hide the "Join Now" CTA for already-subscribed accounts).
 */
export const isPaidSubscription = (subscriptionType?: string | null): boolean =>
  !!subscriptionType &&
  PAID_SUBSCRIPTION_TYPES.some(
    (paid) => paid.toLowerCase() === subscriptionType.toLowerCase()
  );

/**
 * Trial users get full Unlimited-tier access for a fixed window; once that
 * window passes they're prompted to pick a paid plan.
 */
export const isTrialExpired = (
  subscriptionType?: string | null,
  subscriptionExpiration?: string | null
): boolean => {
  if (!subscriptionType || subscriptionType.toLowerCase() !== "trial") return false;
  if (!subscriptionExpiration) return false;
  const expiry = new Date(subscriptionExpiration);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() < Date.now();
};
