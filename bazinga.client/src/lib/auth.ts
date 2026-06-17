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
  twoFactorEnabled?: boolean;
  twoFactorRequired?: boolean;
  challengeToken?: string;
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

// ---------- Two-factor authentication (TOTP) -------------------------------

export type TwoFactorSetupResponse = {
  secret: string;
  otpauthUri: string;
};

/** Begin enrollment — returns the secret + otpauth URI for the QR code. */
export const twoFactorSetup = (token: string) =>
  apiFetch<TwoFactorSetupResponse>("/api/auth/2fa/setup", {
    method: "POST",
    authToken: token,
  });

/** Confirm the first authenticator code and switch 2FA on. */
export const twoFactorConfirm = (token: string, code: string) =>
  apiFetch<SigninVerifyResponse>("/api/auth/2fa/confirm", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ code }),
  });

/** Turn 2FA off (requires a current valid code). */
export const twoFactorDisable = (token: string, code: string) =>
  apiFetch<SigninVerifyResponse>("/api/auth/2fa/disable", {
    method: "POST",
    authToken: token,
    body: JSON.stringify({ code }),
  });

/** Exchange a login challenge + TOTP code for a real session. */
export const twoFactorLoginVerify = (challengeToken: string, code: string) =>
  apiFetch<SigninVerifyResponse>("/api/auth/2fa/login-verify", {
    method: "POST",
    body: JSON.stringify({ challengeToken, code }),
  });
