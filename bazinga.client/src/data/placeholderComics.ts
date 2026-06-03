import comic1 from "@/assets/comic-1.jpg";
import comic2 from "@/assets/comic-2.jpg";
import comic3 from "@/assets/comic-3.jpg";
import comic4 from "@/assets/comic-4.jpg";
import comic5 from "@/assets/comic-5.jpg";
import comic6 from "@/assets/comic-6.jpg";
import comic7 from "@/assets/comic-7.jpg";
import comic8 from "@/assets/comic-8.jpg";

export type PlaceholderComic = {
  id: number;
  title: string;
  series: string;
  character: string;
  creators: string;
  image: string;
  description: string;
  issueNumber: number;
  releaseDate: string;
};

const covers = [comic1, comic2, comic3, comic4, comic5, comic6, comic7, comic8];

const seed: Omit<PlaceholderComic, "id" | "image">[] = [
  {
    title: "Bazinga Origins #1",
    series: "Bazinga Origins",
    character: "Captain Bazinga",
    creators: "Stan Cipher, Jack Vault",
    description:
      "When a routine particle experiment cracks open the multiverse, an unlikely physicist becomes Earth's first line of defense.",
    issueNumber: 1,
    releaseDate: "2026-05-14",
  },
  {
    title: "Night Cipher #4",
    series: "Night Cipher",
    character: "Night Cipher",
    creators: "Mira Halloway, Kenji Sato",
    description:
      "The detective with a stolen identity tracks a serial bomber across three time zones — and one impossible alibi.",
    issueNumber: 4,
    releaseDate: "2026-05-21",
  },
  {
    title: "Solar Flare: Reborn #2",
    series: "Solar Flare",
    character: "Solar Flare",
    creators: "Adia Bright, Tomas Vega",
    description:
      "Stripped of her solar core, Aria Vance must rebuild her powers from scratch while a copycat takes her name.",
    issueNumber: 2,
    releaseDate: "2026-05-21",
  },
  {
    title: "Crimson Vow #12",
    series: "Crimson Vow",
    character: "The Vow",
    creators: "Lars Voden, Yuki Hara",
    description:
      "A sword passed through seven generations finally chooses its wielder. The cost: every memory before this page.",
    issueNumber: 12,
    releaseDate: "2026-04-30",
  },
  {
    title: "Iron Vanguard #7",
    series: "Iron Vanguard",
    character: "Vanguard",
    creators: "Petra Nova, Lou Reyes",
    description:
      "An armored peacekeeper hunts a ghost from her past through a city that no longer remembers her name.",
    issueNumber: 7,
    releaseDate: "2026-05-07",
  },
  {
    title: "Echo Knight #1",
    series: "Echo Knight",
    character: "Echo",
    creators: "Sasha Lorne, Rin Akiyama",
    description:
      "A teenager wakes from a coma hearing every voice that ever spoke in her childhood home. Some of them are dead.",
    issueNumber: 1,
    releaseDate: "2026-05-28",
  },
  {
    title: "Void Reaper #18",
    series: "Void Reaper",
    character: "Void Reaper",
    creators: "Marcus Vex, Ines Olarra",
    description:
      "The last reaper of empty galaxies finds something alive on a dead moon — and decides the contract can wait.",
    issueNumber: 18,
    releaseDate: "2026-04-23",
  },
  {
    title: "Spectral Sirens #3",
    series: "Spectral Sirens",
    character: "Lyra & Nyx",
    creators: "Hadley Quinn, Otto Mendez",
    description:
      "Two opera singers haunt the city that erased their voices — every encore is a confession.",
    issueNumber: 3,
    releaseDate: "2026-05-14",
  },
  {
    title: "Aurora Pact #5",
    series: "Aurora Pact",
    character: "Aurora",
    creators: "Selene Park, Vince Castille",
    description:
      "A daughter of the northern lights signs a treaty with the dark beneath the ice — but the dark reads the fine print.",
    issueNumber: 5,
    releaseDate: "2026-05-07",
  },
  {
    title: "Storm Caller #9",
    series: "Storm Caller",
    character: "Storm Caller",
    creators: "Aja Brand, Niko Ferreira",
    description:
      "Every hurricane she calls down costs her a memory. Today she has to choose between her mother's face and a city.",
    issueNumber: 9,
    releaseDate: "2026-04-30",
  },
  {
    title: "The Vermillion Crown #6",
    series: "Vermillion Crown",
    character: "Empress Vee",
    creators: "Iris Marvell, Theo Drake",
    description:
      "An empress without an empire wages quiet war from inside a museum dedicated to her own downfall.",
    issueNumber: 6,
    releaseDate: "2026-04-16",
  },
  {
    title: "Heroes of Bazinga #100",
    series: "Heroes of Bazinga",
    character: "Captain Bazinga",
    creators: "Stan Cipher, Mira Halloway, Tomas Vega",
    description:
      "A hundred issues. A hundred deaths. The team faces the version of themselves the multiverse never let them be.",
    issueNumber: 100,
    releaseDate: "2026-05-28",
  },
];

export const placeholderComics: PlaceholderComic[] = seed.map((entry, index) => ({
  ...entry,
  id: 10_000 + index,
  image: covers[index % covers.length],
}));

export const placeholderSeries = Array.from(
  new Set(placeholderComics.map((c) => c.series))
).sort();

export const placeholderCharacters = Array.from(
  new Set(placeholderComics.map((c) => c.character))
).sort();

export const placeholderCreators = Array.from(
  new Set(placeholderComics.flatMap((c) => c.creators.split(",").map((s) => s.trim())))
).sort();
