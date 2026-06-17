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

// ---------- Superheroes ----------------------------------------------------

export type SuperheroImages = {
  xs?: string | null;
  sm?: string | null;
  md?: string | null;
  lg?: string | null;
};

export type SuperheroPowerstats = {
  intelligence: number;
  strength: number;
  speed: number;
  durability: number;
  power: number;
  combat: number;
};

export type SuperheroDto = {
  id: number;
  name: string;
  slug: string;
  fullName?: string | null;
  publisher?: string | null;
  alignment?: string | null;
  race?: string | null;
  gender?: string | null;
  occupation?: string | null;
  groupAffiliation?: string | null;
  placeOfBirth?: string | null;
  aliases: string[];
  images: SuperheroImages;
  powerstats: SuperheroPowerstats;
};

export type SuperheroSearchOptions = {
  q?: string;
  page?: number;
  limit?: number;
  publisher?: string;
  alignment?: string;
};

export const fetchSuperheroes = (opts: SuperheroSearchOptions = {}) =>
  apiFetch<PagedResponse<SuperheroDto>>(
    `/api/metadata/superheroes${qs({
      q: opts.q,
      page: opts.page ?? 1,
      limit: opts.limit ?? 24,
      publisher: opts.publisher,
      alignment: opts.alignment,
    })}`
  );

export const fetchSuperheroPublishers = () =>
  apiFetch<string[]>("/api/metadata/superheroes/publishers");

export const fetchSuperhero = (id: number) =>
  apiFetch<SuperheroDto>(`/api/metadata/superheroes/${id}`);

export const superheroSubtitle = (h: SuperheroDto): string => {
  if (h.fullName) return h.fullName;
  if (h.aliases.length) return h.aliases.slice(0, 2).join(" · ");
  return h.publisher ?? "Bazinga Universe";
};

// ---------- Superhero TV shows --------------------------------------------

export type SuperheroShowDto = {
  id: number;
  name: string;
  type?: string | null;
  language?: string | null;
  genres: string[];
  status?: string | null;
  runtime?: number | null;
  premiered?: string | null;
  ended?: string | null;
  summary?: string | null;
  imageMedium?: string | null;
  imageOriginal?: string | null;
  networkName?: string | null;
  officialSite?: string | null;
  rating?: number | null;
};

export const fetchSuperheroShows = () =>
  apiFetch<SuperheroShowDto[]>("/api/metadata/superhero-shows");

export const searchSuperheroShows = (q: string) =>
  apiFetch<SuperheroShowDto[]>(`/api/metadata/superhero-shows/search${qs({ q })}`);

export const fetchSuperheroShow = (id: number) =>
  apiFetch<SuperheroShowDto>(`/api/metadata/superhero-shows/${id}`);

/** Strip HTML tags from TVMaze's summary field. */
export const stripHtml = (html: string | null | undefined): string => {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
};

export const showSubtitle = (s: SuperheroShowDto): string => {
  const yr = s.premiered ? s.premiered.slice(0, 4) : null;
  const network = s.networkName;
  if (yr && network) return `${network} · ${yr}`;
  return network ?? yr ?? "Bazinga TV";
};

export const showMetaLine = (s: SuperheroShowDto): string => {
  const parts: string[] = [];
  if (s.type) parts.push(s.type);
  if (s.runtime) parts.push(`${s.runtime} min`);
  if (s.status) parts.push(s.status);
  if (s.rating) parts.push(`★ ${s.rating.toFixed(1)}`);
  return parts.join(" · ");
};

// ---------- Marvel Comics (Marvel Developer API) -------------------------

export type MarvelComicDto = {
  id: number;
  title: string;
  issueNumber?: number | null;
  description?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  series?: string | null;
  format?: string | null;
  pageCount?: number | null;
  onSaleDate?: string | null;
  printPrice?: number | null;
  creators: string[];
  characters: string[];
  detailUrl?: string | null;
};

export type MarvelPaged = {
  data: MarvelComicDto[];
  offset: number;
  limit: number;
  total: number;
  configured: boolean;
};

export type MarvelStatus = { configured: boolean };

const marvelQs = (params: Record<string, string | number | undefined | null>) => {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, String(v)] as [string, string]);
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
};

export const fetchMarvelStatus = () =>
  apiFetch<MarvelStatus>("/api/metadata/marvel/status");

export type MarvelComicsOptions = {
  page?: number;
  limit?: number;
  q?: string;
  /** "-onsaleDate" (default), "onsaleDate", "-modified", "title". */
  orderBy?: string;
};

export const fetchMarvelComics = (opts: MarvelComicsOptions = {}) =>
  apiFetch<MarvelPaged>(
    `/api/metadata/marvel/comics${marvelQs({
      page: opts.page ?? 1,
      limit: opts.limit ?? 24,
      q: opts.q,
      orderBy: opts.orderBy,
    })}`
  );

export const fetchMarvelComic = (id: number) =>
  apiFetch<MarvelComicDto>(`/api/metadata/marvel/comics/${id}`);

/** Render-ready creator string for a Marvel issue. */
export const marvelCreatorsLine = (c: MarvelComicDto): string => {
  if (c.creators.length === 0) return c.series ?? "Marvel Comics";
  return c.creators.slice(0, 3).join(", ");
};

/** Short subtitle for cards. */
export const marvelSubtitle = (c: MarvelComicDto): string => {
  const year = c.onSaleDate?.slice(0, 4);
  const creators = marvelCreatorsLine(c);
  return year ? `${creators} · ${year}` : creators;
};
