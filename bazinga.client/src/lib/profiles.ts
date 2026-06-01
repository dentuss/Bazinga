import { apiFetch } from "./api";

export type Profile = {
  id: number;
  userId: number;
  name: string;
  avatarUrl?: string | null;
  avatarColor: string;
  avatarIcon?: string | null;
  isRoot: boolean;
  isKids: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ProfileUpsertRequest = {
  name?: string;
  avatarUrl?: string | null;
  avatarColor?: string;
  avatarIcon?: string | null;
  isKids?: boolean;
};

export const MAX_PROFILES_PER_ACCOUNT = 5;

export const PROFILE_PALETTE: string[] = [
  "#E50914",
  "#F97316",
  "#FACC15",
  "#22C55E",
  "#06B6D4",
  "#6366F1",
  "#A855F7",
  "#EC4899",
];

export const PROFILE_ICONS: string[] = [
  "🦸",
  "🦹",
  "🧙",
  "🥷",
  "🤖",
  "👾",
  "🐉",
  "🐺",
  "🦊",
  "🐱",
  "🐻",
  "🦁",
];

export const listProfiles = (token: string) =>
  apiFetch<Profile[]>("/api/profiles", { authToken: token });

export const createProfile = (token: string, body: ProfileUpsertRequest) =>
  apiFetch<Profile>("/api/profiles", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(body),
  });

export const updateProfile = (token: string, id: number, body: ProfileUpsertRequest) =>
  apiFetch<Profile>(`/api/profiles/${id}`, {
    method: "PUT",
    authToken: token,
    body: JSON.stringify(body),
  });

export const deleteProfile = (token: string, id: number) =>
  apiFetch<unknown>(`/api/profiles/${id}`, { method: "DELETE", authToken: token });
