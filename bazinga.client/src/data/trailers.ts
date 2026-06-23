import { BERSERK_EP1_SRC } from "@/data/episodeCatalogue";

export type Trailer = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  src: string;
  badges: string[];
  genres: string[];
  year: number;
  rating: string;
};

export const trailers: Trailer[] = [
  {
    id: "berserk",
    title: "Berserk",
    tagline: "Brand of sacrifice.",
    description:
      "Branded for death, Guts swings his impossibly large blade against demons, fate and his own past. A dark fantasy saga adapted from Kentaro Miura's manga.",
    // No standalone Berserk trailer ships — the hero reel streams a clipped
    // window of the real episode 1 instead. Play still routes to the full
    // episode list via the curated catalogue.
    src: BERSERK_EP1_SRC,
    badges: ["EPIC SAGA", "ANIME UNIVERSE"],
    genres: ["Anime", "Dark Fantasy", "Action"],
    year: 1997,
    rating: "TV-MA",
  },
  {
    id: "the-boys",
    title: "The Boys",
    tagline: "The final season. No one is safe.",
    description:
      "Superpowers, corruption and chaos collide as the Boys take their last stand against Homelander in an explosive battle for the soul of the world.",
    src: "/trailers/the-boys.mp4",
    badges: ["FINAL SEASON", "TOP 10 TODAY"],
    genres: ["Action", "Drama", "Dark Comedy"],
    year: 2025,
    rating: "TV-MA",
  },
  {
    id: "demon-slayer",
    title: "Demon Slayer: Infinity Castle",
    tagline: "The final battle begins.",
    description:
      "Tanjiro and the Hashira are dragged into the ever-shifting Infinity Castle for a desperate war against Muzan and the Upper Rank demons.",
    src: "/trailers/demon-slayer.mp4",
    badges: ["NEW", "ANIME UNIVERSE"],
    genres: ["Anime", "Action", "Fantasy"],
    year: 2025,
    rating: "TV-MA",
  },
  {
    id: "fantastic-four",
    title: "The Fantastic Four: First Steps",
    tagline: "The first family of heroes.",
    description:
      "In a bold retro-futuristic world, Marvel's First Family takes their first steps as heroes to defend humanity from a cosmic threat.",
    src: "/trailers/fantastic-four.mp4",
    badges: ["NEW RELEASE", "TOP 10 TODAY"],
    genres: ["Action", "Sci-Fi", "Adventure"],
    year: 2025,
    rating: "PG-13",
  },
  {
    id: "avengers-doomsday",
    title: "Avengers: Doomsday",
    tagline: "The reckoning is here.",
    description:
      "Earth's mightiest heroes reassemble to confront Doctor Doom as the multiverse teeters on the edge of total collapse.",
    src: "/trailers/avengers-doomsday.mp4",
    badges: ["COMING SOON", "EPIC EVENT"],
    genres: ["Action", "Sci-Fi", "Adventure"],
    year: 2026,
    rating: "PG-13",
  },
];

export const getTrailer = (id: string): Trailer | undefined =>
  trailers.find((trailer) => trailer.id === id);
