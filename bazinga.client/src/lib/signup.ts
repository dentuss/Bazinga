import { apiFetch } from "./api";

export type EmailAvailability = { available: boolean };

export type SignupVerifyReason = "expired" | "consumed" | "invalid";

export type SignupVerifyResponse = {
  valid: boolean;
  email?: string;
  reason?: SignupVerifyReason;
};

export type SignupPlan = "subscribe" | "trial";

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
