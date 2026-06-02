import { apiFetch } from "./api";

export type EmailAvailability = { available: boolean };

export type SignupVerifyReason = "expired" | "consumed" | "invalid";

export type SignupVerifyResponse = {
  valid: boolean;
  email?: string;
  reason?: SignupVerifyReason;
};

/** Plan tokens accepted by `/api/auth/signup/complete`. */
export type SignupPlan = "trial" | "comics" | "tv" | "unlimited";

export type BillingIntentResponse = {
  stripeConfigured: boolean;
  clientSecret?: string;
  publishableKey?: string;
  customerId?: string;
};

export const checkSignupEmail = (email: string) =>
  apiFetch<EmailAvailability>("/api/auth/signup/check", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const startSignup = (email: string, optOutMarketing: boolean) =>
  apiFetch<unknown>("/api/auth/signup/start", {
    method: "POST",
    body: JSON.stringify({ email, optOutMarketing }),
  });

export const verifySignupToken = (token: string) =>
  apiFetch<SignupVerifyResponse>(
    `/api/auth/signup/verify?token=${encodeURIComponent(token)}`
  );

export const createBillingIntent = (token: string, signal?: AbortSignal) =>
  apiFetch<BillingIntentResponse>("/api/auth/signup/billing-intent", {
    method: "POST",
    body: JSON.stringify({ token }),
    signal,
  });
