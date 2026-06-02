import { apiFetch } from "./api";

export type AnimeDto = {
  malId: number;
  title: string;
  titleEnglish?: string | null;
  synopsis?: string | null;
  type?: string | null;
  episodes?: number | null;
  status?: string | null;
  imageUrl?: string | null;
  largeImageUrl?: string | null;
  trailerEmbedUrl?: string | null;
  trailerImageUrl?: string | null;
  score?: number | null;
  rank?: number | null;
  year?: number | null;
  rating?: string | null;
  genres: string[];
  studios: string[];
};

export type MangaDto = {
  malId: number;
  title: string;
  titleEnglish?: string | null;
  synopsis?: string | null;
  type?: string | null;
  chapters?: number | null;
  volumes?: number | null;
  status?: string | null;
  imageUrl?: string | null;
  largeImageUrl?: string | null;
  score?: number | null;
  rank?: number | null;
  genres: string[];
  authors: string[];
};

export type GenreDto = {
  malId: number;
  name: string;
  count?: number | null;
};

export type Pagination = {
  currentPage: number;
  lastVisiblePage: number;
  hasNextPage: boolean;
  totalItems?: number | null;
};

export type PagedResponse<T> = {
  data: T[];
  pagination: Pagination;
};

const qs = (params: Record<string, string | number | boolean | null | undefined>) => {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => [key, String(value)] as [string, string]);
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
};

// ---------- Anime ----------------------------------------------------------

export const fetchTopAnime = (page = 1, limit = 12) =>
  apiFetch<PagedResponse<AnimeDto>>(`/api/metadata/anime/top${qs({ page, limit })}`);

export const fetchSeasonNow = (page = 1, limit = 12) =>
  apiFetch<PagedResponse<AnimeDto>>(`/api/metadata/anime/season-now${qs({ page, limit })}`);

export const fetchSeasonUpcoming = (page = 1, limit = 12) =>
  apiFetch<PagedResponse<AnimeDto>>(`/api/metadata/anime/season-upcoming${qs({ page, limit })}`);

export type AnimeSearchOptions = {
  q?: string;
  page?: number;
  limit?: number;
  genre?: number;
  status?: string;
  type?: string;
  orderBy?: string;
};

export const searchAnime = (opts: AnimeSearchOptions = {}) =>
  apiFetch<PagedResponse<AnimeDto>>(
    `/api/metadata/anime/search${qs({
      q: opts.q,
      page: opts.page ?? 1,
      limit: opts.limit ?? 12,
      genre: opts.genre,
      status: opts.status,
      type: opts.type,
      orderBy: opts.orderBy,
    })}`
  );

export const fetchAnime = (id: number) =>
  apiFetch<AnimeDto>(`/api/metadata/anime/${id}`);

export const fetchAnimeGenres = () => apiFetch<GenreDto[]>("/api/metadata/anime/genres");

// ---------- Manga ----------------------------------------------------------

export const fetchTopManga = (page = 1, limit = 12) =>
  apiFetch<PagedResponse<MangaDto>>(`/api/metadata/manga/top${qs({ page, limit })}`);

export type MangaSearchOptions = {
  q?: string;
  page?: number;
  limit?: number;
  genre?: number;
  status?: string;
  orderBy?: string;
};

export const searchManga = (opts: MangaSearchOptions = {}) =>
  apiFetch<PagedResponse<MangaDto>>(
    `/api/metadata/manga/search${qs({
      q: opts.q,
      page: opts.page ?? 1,
      limit: opts.limit ?? 12,
      genre: opts.genre,
      status: opts.status,
      orderBy: opts.orderBy,
    })}`
  );

export const fetchManga = (id: number) => apiFetch<MangaDto>(`/api/metadata/manga/${id}`);

export const fetchMangaGenres = () => apiFetch<GenreDto[]>("/api/metadata/manga/genres");

// ---------- Helpers --------------------------------------------------------

const animePlaceholders = [
  "Stream the multiverse, episode by episode.",
  "Heroes rise. Villains fall. Repeat.",
  "A tale from the Bazinga vault.",
];

/** Fallback synopsis when Jikan omits one (rare). */
export const animeSubtitle = (a: AnimeDto): string => {
  if (a.synopsis) return a.synopsis;
  return animePlaceholders[a.malId % animePlaceholders.length];
};

/** Compose a "S1·24 ep · 2023" style chip line. */
export const animeMetaLine = (a: AnimeDto): string => {
  const parts: string[] = [];
  if (a.type) parts.push(a.type);
  if (a.episodes) parts.push(`${a.episodes} ep`);
  if (a.year) parts.push(String(a.year));
  if (a.rating) parts.push(a.rating.split(" ")[0]);
  return parts.join(" · ");
};

export const mangaMetaLine = (m: MangaDto): string => {
  const parts: string[] = [];
  if (m.type) parts.push(m.type);
  if (m.chapters) parts.push(`${m.chapters} ch`);
  if (m.volumes) parts.push(`${m.volumes} vol`);
  if (m.status) parts.push(m.status);
  return parts.join(" · ");
};
