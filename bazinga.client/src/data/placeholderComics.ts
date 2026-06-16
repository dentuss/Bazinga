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
  {
    title: "Bazinga Origins #2",
    series: "Bazinga Origins",
    character: "Captain Bazinga",
    creators: "Stan Cipher, Jack Vault",
    description:
      "Captain Bazinga's first solo mission goes sideways when a rival from his particle-lab days resurfaces wearing the wrong face.",
    issueNumber: 2,
    releaseDate: "2026-06-04",
  },
  {
    title: "Night Cipher #5",
    series: "Night Cipher",
    character: "Night Cipher",
    creators: "Mira Halloway, Kenji Sato",
    description:
      "The bomb maker writes letters now — to the detective who used to be her sister, in a hand that died fifteen years ago.",
    issueNumber: 5,
    releaseDate: "2026-06-11",
  },
  {
    title: "Solar Flare: Reborn #3",
    series: "Solar Flare",
    character: "Solar Flare",
    creators: "Adia Bright, Tomas Vega",
    description:
      "Aria's copycat takes Tokyo hostage with a stolen sliver of her old solar core. She has 12 hours of daylight to take it back.",
    issueNumber: 3,
    releaseDate: "2026-06-04",
  },
  {
    title: "Crimson Vow #13",
    series: "Crimson Vow",
    character: "The Vow",
    creators: "Lars Voden, Yuki Hara",
    description:
      "The sword chose her, then chose her again — every reset costs another memory. Today she forgets her name.",
    issueNumber: 13,
    releaseDate: "2026-06-18",
  },
  {
    title: "Iron Vanguard #8",
    series: "Iron Vanguard",
    character: "Vanguard",
    creators: "Petra Nova, Lou Reyes",
    description:
      "The ghost from her past was wearing the same armor. They built it together. Only one of them remembers why.",
    issueNumber: 8,
    releaseDate: "2026-06-11",
  },
  {
    title: "Echo Knight #2",
    series: "Echo Knight",
    character: "Echo",
    creators: "Sasha Lorne, Rin Akiyama",
    description:
      "Every voice in the house went silent on the same day. Echo is the only one who can hear them screaming again.",
    issueNumber: 2,
    releaseDate: "2026-06-18",
  },
  {
    title: "Void Reaper #19",
    series: "Void Reaper",
    character: "Void Reaper",
    creators: "Marcus Vex, Ines Olarra",
    description:
      "She broke her contract once. The Reaper Court has sent the only enforcer she's never been able to outrun: her older self.",
    issueNumber: 19,
    releaseDate: "2026-06-04",
  },
  {
    title: "Spectral Sirens #4",
    series: "Spectral Sirens",
    character: "Lyra & Nyx",
    creators: "Hadley Quinn, Otto Mendez",
    description:
      "The opera house reopens — under new ownership. The audience never leaves their seats. Encore.",
    issueNumber: 4,
    releaseDate: "2026-06-11",
  },
  {
    title: "Aurora Pact #6",
    series: "Aurora Pact",
    character: "Aurora",
    creators: "Selene Park, Vince Castille",
    description:
      "Winter ends a month early. The dark beneath the ice has questions about clause seventeen, and it's not asking nicely.",
    issueNumber: 6,
    releaseDate: "2026-06-04",
  },
  {
    title: "Storm Caller #10",
    series: "Storm Caller",
    character: "Storm Caller",
    creators: "Aja Brand, Niko Ferreira",
    description:
      "A coastline went under so a city could keep its name. The price of the next storm is somebody else's name entirely.",
    issueNumber: 10,
    releaseDate: "2026-06-18",
  },
  {
    title: "The Vermillion Crown #7",
    series: "Vermillion Crown",
    character: "Empress Vee",
    creators: "Iris Marvell, Theo Drake",
    description:
      "The museum hires a new curator. He came with the empress. He's been with the empress for a thousand years.",
    issueNumber: 7,
    releaseDate: "2026-06-11",
  },
  {
    title: "Hollow Sun #1",
    series: "Hollow Sun",
    character: "Halen Krieg",
    creators: "Ravi Patel, Ada Olsen",
    description:
      "An astronomer who hears the sun thinking has 88 minutes to convince anyone — anyone — that it's planning a goodbye.",
    issueNumber: 1,
    releaseDate: "2026-06-25",
  },
  {
    title: "Tinhouse Brigade #14",
    series: "Tinhouse Brigade",
    character: "Officer Munro",
    creators: "Devon Wirt, Lucia Vance",
    description:
      "A working-class precinct of low-power vigilantes investigates a murder in a building where every tenant has the same alibi.",
    issueNumber: 14,
    releaseDate: "2026-06-25",
  },
  {
    title: "Stardrift Cantata #3",
    series: "Stardrift Cantata",
    character: "Conductor Pira",
    creators: "Yuki Hara, Daniel Otts",
    description:
      "The first interstellar opera tour has gone silent between systems. The encore is being broadcast from a place that should be empty.",
    issueNumber: 3,
    releaseDate: "2026-06-25",
  },
  {
    title: "Ferrous Maiden #2",
    series: "Ferrous Maiden",
    character: "Lin Marrow",
    creators: "Beatrice Holt, Quan Le",
    description:
      "A steelworks crime-noir about a labour lawyer who can rust anything she touches — including the case files mysteriously closing themselves.",
    issueNumber: 2,
    releaseDate: "2026-07-02",
  },
  {
    title: "Kestrel Protocol #11",
    series: "Kestrel Protocol",
    character: "Agent Kestrel",
    creators: "Ines Olarra, Felix Anders",
    description:
      "The intelligence service that doesn't exist asks her to assassinate someone who, on paper, never existed either. They sent her his diary.",
    issueNumber: 11,
    releaseDate: "2026-07-02",
  },
  {
    title: "Lighthouse Saint #1",
    series: "Lighthouse Saint",
    character: "Brother Cael",
    creators: "Marcus Vex, Sasha Lorne",
    description:
      "A monk on a coast that hasn't seen a ship in forty years lights the lamp anyway. Tonight, something answers from the open water.",
    issueNumber: 1,
    releaseDate: "2026-07-02",
  },
  {
    title: "Static Bloom #8",
    series: "Static Bloom",
    character: "Mae Drift",
    creators: "Adia Bright, Ravi Patel",
    description:
      "Every flower in the city blooms the same color the day the radio stations stop. Mae remembers when colour meant something.",
    issueNumber: 8,
    releaseDate: "2026-07-09",
  },
  {
    title: "Heroes of Bazinga #101",
    series: "Heroes of Bazinga",
    character: "Captain Bazinga",
    creators: "Stan Cipher, Mira Halloway, Tomas Vega",
    description:
      "After the hundredth-issue catastrophe, the team rebuilds — minus one. Whose seat at the table stays empty?",
    issueNumber: 101,
    releaseDate: "2026-07-09",
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
