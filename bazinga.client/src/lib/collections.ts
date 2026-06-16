import { apiFetch } from "./api";

export type CollectionName = "library" | "mylist";
export type CollectionKind = "comic" | "manga" | "anime" | "show";

export type CollectionItem = {
  id: number;
  collection: CollectionName;
  kind: CollectionKind;
  contentId: string;
  title: string;
  image?: string | null;
  subtitle?: string | null;
  payloadJson?: string | null;
  addedAt: string;
};

export type CollectionItemInput = {
  kind: CollectionKind;
  contentId: string;
  title: string;
  image?: string | null;
  subtitle?: string | null;
  /** Arbitrary object stored as JSON so the card can re-open its modal later. */
  payload?: unknown;
};

const profileHeader = (profileId: number | null | undefined): Record<string, string> =>
  profileId != null ? { "X-Profile-Id": String(profileId) } : {};

export const listCollection = (
  token: string,
  profileId: number | null,
  collection: CollectionName
) =>
  apiFetch<CollectionItem[]>(`/api/collections/${collection}`, {
    authToken: token,
    headers: profileHeader(profileId),
  });

export const addToCollection = (
  token: string,
  profileId: number | null,
  collection: CollectionName,
  input: CollectionItemInput
) =>
  apiFetch<CollectionItem[]>(`/api/collections/${collection}`, {
    method: "POST",
    authToken: token,
    headers: profileHeader(profileId),
    body: JSON.stringify({
      kind: input.kind,
      contentId: input.contentId,
      title: input.title,
      image: input.image ?? null,
      subtitle: input.subtitle ?? null,
      payloadJson: input.payload != null ? JSON.stringify(input.payload) : null,
    }),
  });

export const removeFromCollection = (
  token: string,
  profileId: number | null,
  collection: CollectionName,
  kind: CollectionKind,
  contentId: string
) =>
  apiFetch<CollectionItem[]>(
    `/api/collections/${collection}/${kind}/${encodeURIComponent(contentId)}`,
    {
      method: "DELETE",
      authToken: token,
      headers: profileHeader(profileId),
    }
  );

/** Key for membership lookups: kind + contentId uniquely identify an item. */
export const collectionKey = (kind: CollectionKind, contentId: string) => `${kind}:${contentId}`;

/** Safely parse the stored payload JSON back into a typed object. */
export const parsePayload = <T,>(item: CollectionItem): T | null => {
  if (!item.payloadJson) return null;
  try {
    return JSON.parse(item.payloadJson) as T;
  } catch {
    return null;
  }
};
