import { apiFetch } from "./api";

// ---------------------------------------------------------------------------
// Media catalogue — what the SPA pulls from /api/media instead of the static
// data/episodeCatalogue.ts and data/trailers.ts (both gone after the cutover).
// Shapes mirror the server's MediaItemDto / MediaSeasonDto / MediaEpisodeDto.
// ---------------------------------------------------------------------------

export type MediaKind = "trailer" | "show" | "movie";

export interface MediaEpisode {
  id: number;
  number: number;
  title: string;
  description?: string | null;
  runtimeMinutes?: number | null;
  videoUrl: string;
  thumbnail?: string | null;
}

export interface MediaSeason {
  id: number;
  number: number;
  title?: string | null;
  sortOrder: number;
  episodes: MediaEpisode[];
}

export interface MediaItem {
  id: number;
  slug: string;
  kind: MediaKind;
  title: string;
  tagline?: string | null;
  description?: string | null;
  year?: number | null;
  rating?: string | null;
  genres: string[];
  badges: string[];
  backdropImage?: string | null;
  posterImage?: string | null;
  trailerUrl?: string | null;
  isFeatured: boolean;
  sortOrder: number;
  /** Populated only on detail responses. */
  seasons: MediaSeason[];
}

/** All items (optionally filtered by kind). Lightweight — no seasons. */
export const listMedia = (kind?: MediaKind) =>
  apiFetch<MediaItem[]>(`/api/media${kind ? `?kind=${kind}` : ""}`);

/** Items flagged for the rotating TV hero. */
export const fetchFeaturedMedia = () =>
  apiFetch<MediaItem[]>("/api/media/featured");

/** Full item + seasons + episodes — what the Watch page renders. */
export const fetchMediaBySlug = (slug: string) =>
  apiFetch<MediaItem>(`/api/media/${encodeURIComponent(slug)}`);
