/**
 * Multi-episode catalogue for the Watch screen.
 *
 * Real episode files don't ship with the demo, but every Bazinga title needs
 * to *act* like real content — multiple seasons, real episode titles, real
 * durations and a real video stream. Each entry maps to one of the trailer
 * mp4s in `/trailers/*` which means Play actually plays something for every
 * title; the metadata (titles, descriptions) come from this curated set so
 * the Series-style episode picker reads as legitimate.
 */

export type Episode = {
  /** Season-scoped episode number (1-based). */
  number: number;
  title: string;
  description: string;
  /** Runtime in minutes, used in the picker chip. */
  runtimeMinutes: number;
  /** mp4 path inside /public so <video src=…> works. */
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

const TRAILER_SRC = {
  berserk: "/trailers/berserk.mp4",
  boys: "/trailers/the-boys.mp4",
  demonSlayer: "/trailers/demon-slayer.mp4",
  fantasticFour: "/trailers/fantastic-four.mp4",
  avengersDoomsday: "/trailers/avengers-doomsday.mp4",
} as const;

/** Curated entries that have real-feeling episode lists. */
const curated: WatchEntry[] = [
  {
    id: "trailer-berserk",
    title: "Berserk",
    tagline: "Brand of sacrifice.",
    description:
      "Branded for death, Guts swings his impossibly large blade against demons, fate and his own past. A dark fantasy saga adapted from Kentaro Miura's manga.",
    year: 2016,
    rating: "TV-MA",
    genres: ["Dark Fantasy", "Action", "Anime"],
    seasons: [
      {
        number: 1,
        episodes: [
          {
            number: 1,
            title: "Brand of Sacrifice",
            description:
              "Guts wakes branded, the world tilted against him. The Black Swordsman begins his hunt.",
            runtimeMinutes: 24,
            src: TRAILER_SRC.berserk,
          },
          {
            number: 2,
            title: "Guardians of Desire",
            description:
              "A village in the grip of an Apostle gives Guts his first taste of vengeance — and consequence.",
            runtimeMinutes: 24,
            src: TRAILER_SRC.berserk,
          },
          {
            number: 3,
            title: "The Golden Age",
            description:
              "A flashback opens onto the mercenary band that once made Guts feel like he belonged.",
            runtimeMinutes: 24,
            src: TRAILER_SRC.berserk,
          },
          {
            number: 4,
            title: "Band of the Hawk",
            description:
              "Griffith offers a place at his side. Guts has to swing his sword to earn it.",
            runtimeMinutes: 24,
            src: TRAILER_SRC.berserk,
          },
          {
            number: 5,
            title: "A Wind of Swords",
            description:
              "The Hawks tear through the Hundred Year War. Guts becomes Griffith's living blade.",
            runtimeMinutes: 24,
            src: TRAILER_SRC.berserk,
          },
          {
            number: 6,
            title: "The Eclipse",
            description:
              "The Behelit awakens. The God Hand descends. Nothing stays the same.",
            runtimeMinutes: 26,
            src: TRAILER_SRC.berserk,
          },
        ],
      },
      {
        number: 2,
        episodes: [
          {
            number: 1,
            title: "After the Eclipse",
            description:
              "Guts wakes in a ruined world with the Brand and a vow that drowns out everything else.",
            runtimeMinutes: 24,
            src: TRAILER_SRC.berserk,
          },
          {
            number: 2,
            title: "The Lost Children",
            description:
              "An elf-haunted forest hides a child Apostle and the people who fed her.",
            runtimeMinutes: 24,
            src: TRAILER_SRC.berserk,
          },
          {
            number: 3,
            title: "Conviction",
            description:
              "On the Hill of Swords Guts learns that the only thing harder than fighting demons is staying human.",
            runtimeMinutes: 24,
            src: TRAILER_SRC.berserk,
          },
        ],
      },
    ],
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
    seasons: [
      {
        number: 1,
        episodes: [
          {
            number: 1,
            title: "The Name of the Game",
            description:
              "Hughie Campbell's life ends, then restarts, when Translucent reveals what Supes are actually like.",
            runtimeMinutes: 60,
            src: TRAILER_SRC.boys,
          },
          {
            number: 2,
            title: "Cherry",
            description:
              "Butcher offers a way to fight back. Annie January discovers the cost of the cape.",
            runtimeMinutes: 56,
            src: TRAILER_SRC.boys,
          },
          {
            number: 3,
            title: "Get Some",
            description:
              "A-Train's secret comes out. The Boys realise Compound V is the whole industry.",
            runtimeMinutes: 58,
            src: TRAILER_SRC.boys,
          },
        ],
      },
      {
        number: 4,
        episodes: [
          {
            number: 1,
            title: "Department of Dirty Tricks",
            description:
              "The election looms. Vought weaponises news. Butcher gets a clock.",
            runtimeMinutes: 64,
            src: TRAILER_SRC.boys,
          },
          {
            number: 2,
            title: "Life Among the Septics",
            description:
              "A doomsday cult, a barn full of cameras and a sit-down that goes wrong in every way.",
            runtimeMinutes: 60,
            src: TRAILER_SRC.boys,
          },
          {
            number: 3,
            title: "We'll Keep the Red Flag Flying Here",
            description:
              "Homelander's grip on the Seven slips. Frenchie revisits the lab.",
            runtimeMinutes: 62,
            src: TRAILER_SRC.boys,
          },
          {
            number: 4,
            title: "Wisdom of the Ages",
            description:
              "An old hero shows up with a confession. Hughie finally sees what Butcher is becoming.",
            runtimeMinutes: 58,
            src: TRAILER_SRC.boys,
          },
        ],
      },
    ],
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
            title: "Descent into the Infinity Castle",
            description:
              "The Hashira fall through the moving walls. Tanjiro reaches for his sword in the dark.",
            runtimeMinutes: 50,
            src: TRAILER_SRC.demonSlayer,
          },
          {
            number: 2,
            title: "Upper Rank Three",
            description:
              "Akaza and Tanjiro meet again. The fight is the conversation neither of them wanted.",
            runtimeMinutes: 48,
            src: TRAILER_SRC.demonSlayer,
          },
          {
            number: 3,
            title: "Shinobu's Last Breath",
            description:
              "Shinobu pours every poison she owns into Doma. Kanao keeps watch.",
            runtimeMinutes: 52,
            src: TRAILER_SRC.demonSlayer,
          },
          {
            number: 4,
            title: "Sunrise",
            description:
              "Daybreak edges into the Infinity Castle. Muzan stops running.",
            runtimeMinutes: 55,
            src: TRAILER_SRC.demonSlayer,
          },
        ],
      },
    ],
  },
  {
    id: "trailer-fantastic-four",
    title: "The Fantastic Four: First Steps",
    tagline: "The first family of heroes.",
    description:
      "In a bold retro-futuristic world, Marvel's First Family takes their first steps as heroes to defend humanity from a cosmic threat.",
    year: 2025,
    rating: "PG-13",
    genres: ["Action", "Sci-Fi", "Adventure"],
    seasons: [
      {
        number: 1,
        episodes: [
          {
            number: 1,
            title: "Launch Day",
            description:
              "An experimental flight tears the team apart and rebuilds them as something the world has never seen.",
            runtimeMinutes: 28,
            src: TRAILER_SRC.fantasticFour,
          },
          {
            number: 2,
            title: "Four",
            description:
              "Reed maps their new bodies. Ben learns to live in his.",
            runtimeMinutes: 30,
            src: TRAILER_SRC.fantasticFour,
          },
          {
            number: 3,
            title: "Herald in the Sky",
            description:
              "A silver figure on a board crosses the moon. The signal cracks every receiver on Earth.",
            runtimeMinutes: 32,
            src: TRAILER_SRC.fantasticFour,
          },
          {
            number: 4,
            title: "Galactus",
            description:
              "The First Family steps up against a hunger the size of a planet.",
            runtimeMinutes: 35,
            src: TRAILER_SRC.fantasticFour,
          },
        ],
      },
    ],
  },
  {
    id: "trailer-avengers-doomsday",
    title: "Avengers: Doomsday",
    tagline: "The reckoning is here.",
    description:
      "Earth's mightiest heroes reassemble to confront Doctor Doom as the multiverse teeters on the edge of total collapse.",
    year: 2026,
    rating: "PG-13",
    genres: ["Action", "Sci-Fi", "Adventure"],
    seasons: [
      {
        number: 1,
        episodes: [
          {
            number: 1,
            title: "First Crack",
            description:
              "A reality skitters and a familiar mask steps through. The call goes out.",
            runtimeMinutes: 36,
            src: TRAILER_SRC.avengersDoomsday,
          },
          {
            number: 2,
            title: "Council of Realities",
            description:
              "Variants meet variants. Some have nothing in common but the helmet.",
            runtimeMinutes: 38,
            src: TRAILER_SRC.avengersDoomsday,
          },
          {
            number: 3,
            title: "Doomsday",
            description:
              "The lines between universes thin. Heroes pick a side that does not yet exist.",
            runtimeMinutes: 42,
            src: TRAILER_SRC.avengersDoomsday,
          },
        ],
      },
    ],
  },
];

const curatedById = new Map(curated.map((c) => [c.id, c]));

/**
 * Pick a deterministic trailer mp4 so any metadata-only show always has at
 * least one playable file. The choice is keyed on the id so the same show
 * always plays the same backing trailer.
 */
const fallbackSrcFor = (id: string): string => {
  const choices = [
    TRAILER_SRC.berserk,
    TRAILER_SRC.boys,
    TRAILER_SRC.demonSlayer,
    TRAILER_SRC.fantasticFour,
    TRAILER_SRC.avengersDoomsday,
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return choices[Math.abs(hash) % choices.length];
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
  const curated = getCuratedEntry(params.id);
  if (curated) {
    return {
      ...curated,
      backdrop: params.backdrop ?? curated.backdrop,
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
