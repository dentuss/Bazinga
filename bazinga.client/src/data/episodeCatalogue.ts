/**
 * Multi-episode catalogue for the Watch screen.
 *
 * Real video files live under `/public/Series_films`. Filenames contain spaces
 * and mixed case, so every `src` is percent-encoded through `seriesPath`.
 * Titles not in this curated set fall back to a short trailer clip so the
 * player always has something to render.
 *
 * ⚠ The Boys ships as `.mkv`. Most browsers (Chrome, Firefox, Safari) cannot
 * play the Matroska container natively — the episodes are wired up exactly as
 * the files are named, but to guarantee in-browser playback they should be
 * remuxed/transcoded to `.mp4` (H.264 video + AAC audio). Berserk and
 * Demon Slayer are `.mp4` and play everywhere.
 */

export type Episode = {
  /** Season-scoped episode number (matches the on-disk filename). */
  number: number;
  title: string;
  description: string;
  /** Runtime in minutes, used in the picker chip. */
  runtimeMinutes: number;
  /** Path inside /public so <video src=…> works. */
  src: string;
  /** Backdrop shown in the player chrome — defaults to the show poster. */
  thumbnail?: string;
};

export type Season = {
  number: number;
  episodes: Episode[];
};

export type WatchEntry = {
  /** Stable id: `trailer-<slug>`, `anime-<malId>`, `show-<tvmazeId>`. */
  id: string;
  title: string;
  tagline?: string;
  description: string;
  /** Backdrop image — when missing, the player falls back to a gradient. */
  backdrop?: string;
  year?: number;
  rating?: string;
  genres?: string[];
  seasons: Season[];
};

/**
 * Percent-encode each path segment so spaces and mixed-case filenames under
 * /public/Series_films resolve. `/` is preserved by encoding per-segment.
 */
const seriesPath = (...segments: string[]) =>
  `/Series_films/${segments.map(encodeURIComponent).join("/")}`;

/** Real Berserk (1997) episode 1 — reused as the hero background clip. */
export const BERSERK_EP1_SRC = seriesPath("Berserk", "Episode 1 The Black Swordsman.mp4");

/**
 * Short promo clips (mp4) that ship in /public/trailers — used only as the
 * fallback source for metadata-only titles (random MAL anime / TVMaze shows)
 * so Play always lands on something playable. All four are H.264 mp4.
 */
const FALLBACK_CLIPS = [
  "/trailers/fantastic-four.mp4",
  "/trailers/avengers-doomsday.mp4",
  "/trailers/demon-slayer.mp4",
  "/trailers/the-boys.mp4",
] as const;

// --- Berserk (1997) — real episodes, mp4 -----------------------------------
// The folder ships episodes 1, 3–8 (no episode 2); numbers below mirror the
// files exactly so the picker reflects what actually exists on disk.
const berserkEpisodes: Episode[] = [
  {
    number: 1,
    title: "The Black Swordsman",
    description:
      "Branded for death, Guts cuts through Apostles as the lone Black Swordsman.",
    runtimeMinutes: 24,
    src: seriesPath("Berserk", "Episode 1 The Black Swordsman.mp4"),
  },
  {
    number: 3,
    title: "The Golden Age, Part 1 — Guts",
    description:
      "A flashback to the mercenary days that first gave Guts a place to belong.",
    runtimeMinutes: 24,
    src: seriesPath("Berserk", "Episode 3 The Golden age Part 1-Guts.mp4"),
  },
  {
    number: 4,
    title: "The Golden Age, Part 2 — Band of the Hawk",
    description:
      "Griffith offers Guts a place at his side — he has to earn it with his sword.",
    runtimeMinutes: 24,
    src: seriesPath("Berserk", "Episode 4 The Golden age Part-2 Band of Hawk.mp4"),
  },
  {
    number: 5,
    title: "The Golden Age, Part 3 — Griffith",
    description:
      "The Hawks rise through the Hundred Year War as Guts becomes Griffith's living blade.",
    runtimeMinutes: 24,
    src: seriesPath("Berserk", "Episode 5 The Golden Age Part 3-Griffith.mp4"),
  },
  {
    number: 6,
    title: "Nosferatu Zodd",
    description:
      "The Hawks meet a monster that should not exist — and a warning about Griffith's fate.",
    runtimeMinutes: 24,
    src: seriesPath("Berserk", "Episode 6 Nosferatu Zodd.mp4"),
  },
  {
    number: 7,
    title: "Sword Master",
    description:
      "A duel with a master swordsman pushes Guts to find what he is really fighting for.",
    runtimeMinutes: 24,
    src: seriesPath("Berserk", "Episode 7 Sword Master.mp4"),
  },
  {
    number: 8,
    title: "Assassin",
    description:
      "Court intrigue turns deadly as an assassin sets sights on the Band of the Hawk.",
    runtimeMinutes: 24,
    src: seriesPath("Berserk", "Episode 8 Assassin.mp4"),
  },
];

// --- The Boys — Season 5, real episodes, mkv (see header note) -------------
const boysEpisodes: Episode[] = Array.from({ length: 8 }, (_, i) => {
  const n = i + 1;
  return {
    number: n,
    title: `Episode ${n}`,
    description: `The Boys — Season 5, Episode ${n}. Streaming on Bazinga TV.`,
    runtimeMinutes: 60,
    // Files are S05E01…S05E08 — all single-digit, so `E0${n}` is correct.
    src: seriesPath("The Boys", `The.Boys.S05E0${n}.WEB-DLRip.x264.seleZen.mkv`),
  };
});

/** Curated entries backed by real files in /public/Series_films. */
const curated: WatchEntry[] = [
  {
    id: "trailer-berserk",
    title: "Berserk",
    tagline: "Brand of sacrifice.",
    description:
      "Branded for death, Guts swings his impossibly large blade against demons, fate and his own past. A dark fantasy saga adapted from Kentaro Miura's manga.",
    year: 1997,
    rating: "TV-MA",
    genres: ["Dark Fantasy", "Action", "Anime"],
    seasons: [{ number: 1, episodes: berserkEpisodes }],
  },
  {
    id: "trailer-the-boys",
    title: "The Boys",
    tagline: "The final season. No one is safe.",
    description:
      "Superpowers, corruption and chaos collide as the Boys take their last stand against Homelander in an explosive battle for the soul of the world.",
    year: 2025,
    rating: "TV-MA",
    genres: ["Action", "Drama", "Dark Comedy"],
    seasons: [{ number: 5, episodes: boysEpisodes }],
  },
  {
    id: "trailer-demon-slayer",
    title: "Demon Slayer: Infinity Castle",
    tagline: "The final battle begins.",
    description:
      "Tanjiro and the Hashira are dragged into the ever-shifting Infinity Castle for a desperate war against Muzan and the Upper Rank demons.",
    year: 2025,
    rating: "TV-MA",
    genres: ["Anime", "Action", "Fantasy"],
    seasons: [
      {
        number: 1,
        episodes: [
          {
            number: 1,
            title: "Infinity Castle (Movie)",
            description:
              "The Demon Slayer Corps plunges into Muzan's shifting fortress for the war that ends the Golden Age of demons.",
            runtimeMinutes: 155,
            src: seriesPath("Demon_Slayer_Movie.mp4"),
          },
        ],
      },
    ],
  },
];

const curatedById = new Map(curated.map((c) => [c.id, c]));

/**
 * Pick a deterministic fallback clip so any metadata-only show always has at
 * least one playable file. Keyed on the id so the same title always plays the
 * same backing clip.
 */
const fallbackSrcFor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return FALLBACK_CLIPS[Math.abs(hash) % FALLBACK_CLIPS.length];
};

const synthesizedEpisode = (
  id: string,
  seasonNumber: number,
  number: number,
  showTitle: string
): Episode => ({
  number,
  title: `Episode ${number}`,
  description: `${showTitle} — season ${seasonNumber}, episode ${number}. Streaming on Bazinga TV.`,
  runtimeMinutes: 24,
  src: fallbackSrcFor(id),
});

const synthesizeSeasons = (
  id: string,
  title: string,
  totalEpisodes: number
): Season[] => {
  const eps = Math.max(1, Math.min(totalEpisodes || 6, 60));
  const seasons: Season[] = [];
  if (eps <= 12) {
    seasons.push({
      number: 1,
      episodes: Array.from({ length: eps }, (_, i) =>
        synthesizedEpisode(id, 1, i + 1, title)
      ),
    });
    return seasons;
  }
  const perSeason = 12;
  const seasonCount = Math.min(4, Math.ceil(eps / perSeason));
  for (let s = 1; s <= seasonCount; s++) {
    const remaining = eps - (s - 1) * perSeason;
    const count = Math.min(perSeason, remaining);
    seasons.push({
      number: s,
      episodes: Array.from({ length: count }, (_, i) =>
        synthesizedEpisode(id, s, i + 1, title)
      ),
    });
  }
  return seasons;
};

export const getCuratedEntry = (id: string): WatchEntry | undefined =>
  curatedById.get(id);

/**
 * Build a WatchEntry for a metadata-only title (anime by mal id, TV show by
 * id). Falls back to a synthesized multi-season list so the player always has
 * something to render.
 */
export const buildWatchEntry = (params: {
  id: string;
  title: string;
  description: string;
  backdrop?: string;
  year?: number;
  rating?: string;
  genres?: string[];
  totalEpisodes?: number;
}): WatchEntry => {
  const existing = getCuratedEntry(params.id);
  if (existing) {
    return {
      ...existing,
      backdrop: params.backdrop ?? existing.backdrop,
    };
  }
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    backdrop: params.backdrop,
    year: params.year,
    rating: params.rating,
    genres: params.genres,
    seasons: synthesizeSeasons(params.id, params.title, params.totalEpisodes ?? 8),
  };
};
