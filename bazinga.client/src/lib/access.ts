/**
 * Subscription access helpers.
 *
 * Plan names come from the server (SubscriptionsController.cs): "Comics",
 * "TV", "Unlimited", "Premium", plus a "Free" baseline and "trial" rolled in
 * by the signup wizard. Comparisons are case-insensitive so we don't break
 * if the casing ever drifts.
 */

const normalize = (sub?: string | null) => sub?.trim().toLowerCase() ?? "";

/** Comics reading is unlocked by Comics, Unlimited, Premium, or active trial. */
export const hasComicsAccess = (subscriptionType?: string | null): boolean => {
  const sub = normalize(subscriptionType);
  return sub === "comics" || sub === "unlimited" || sub === "premium" || sub === "trial";
};

/** Watching TV is unlocked by TV, Unlimited, Premium, or active trial. */
export const hasTVAccess = (subscriptionType?: string | null): boolean => {
  const sub = normalize(subscriptionType);
  return sub === "tv" || sub === "unlimited" || sub === "premium" || sub === "trial";
};
