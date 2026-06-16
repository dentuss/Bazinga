import { apiFetch } from "./api";

/**
 * Lightweight wrappers around the new auth endpoints. The richer
 * AuthContext methods (login / completeSignup / refreshProfiles / …) live in
 * @/contexts/AuthContext; these are the standalone flows that don't need to
 * mutate the auth context immediately (magic-link request, password reset).
 */

export const signinStart = (email: string) =>
  apiFetch<void>("/api/auth/signin/start", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export type SigninVerifyResponse = {
  token: string;
  userId: number;
  username: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  subscriptionType?: string;
  subscriptionExpiration?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const signinVerify = (token: string) =>
  apiFetch<SigninVerifyResponse>("/api/auth/signin/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

export const forgotPassword = (email: string) =>
  apiFetch<void>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token: string, newPassword: string) =>
  apiFetch<void>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });

export type UpdateAccountInput = {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
};

export const updateAccount = (token: string, body: UpdateAccountInput) =>
  apiFetch<SigninVerifyResponse>("/api/auth/me", {
    method: "PUT",
    authToken: token,
    body: JSON.stringify(body),
  });
