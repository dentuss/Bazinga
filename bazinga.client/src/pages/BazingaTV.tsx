import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Info,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteHeader, { type SiteHeaderNavItem } from "@/components/SiteHeader";
import heroBanner1 from "@/assets/hero-banner-1.jpg";
import heroBanner2 from "@/assets/hero-banner-2.jpg";
import heroBanner3 from "@/assets/hero-banner-3.jpg";
import comic1 from "@/assets/comic-1.jpg";
import comic2 from "@/assets/comic-2.jpg";
import comic3 from "@/assets/comic-3.jpg";
import comic4 from "@/assets/comic-4.jpg";
import comic5 from "@/assets/comic-5.jpg";
import comic6 from "@/assets/comic-6.jpg";
import comic7 from "@/assets/comic-7.jpg";
import comic8 from "@/assets/comic-8.jpg";

type Show = {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  year: number;
  rating: string;
  seasons?: number;
  matchPercent: number;
  genres: string[];
  tags: string[];
  description: string;
};

type ContinueWatching = {
  id: string;
  title: string;
  episode: string;
  backdrop: string;
  progress: number;
  newEpisodes?: boolean;
};

const posters = [comic1, comic2, comic3, comic4, comic5, comic6, comic7, comic8];
const backdrops = [heroBanner1, heroBanner2, heroBanner3];

const buildShow = (
  id: string,
  title: string,
  index: number,
  meta: Partial<Show> = {}
): Show => ({
  id,
  title,
  poster: posters[index % posters.length],
  backdrop: backdrops[index % backdrops.length],
  year: 2024 - (index % 5),
  rating: ["TV-14", "TV-MA", "TV-PG"][index % 3],
  seasons: 1 + (index % 4),
  matchPercent: 78 + ((index * 3) % 22),
  genres: ["Action", "Sci-Fi", "Anime", "Drama", "Mystery", "Thriller"].slice(
    index % 3,
    (index % 3) + 3
  ),
  tags: ["Unconventional", "Dark", "Cinematic", "Mind-Bending", "Heartfelt"].slice(
    index % 3,
    (index % 3) + 3
  ),
  description:
    meta.description ??
    "A legendary tale from the Bazinga multiverse — heroes rise, empires fall, and the cosmos shifts forever.",
  ...meta,
});

const heroFeatured = {
  title: "HEROES OF BAZINGA",
  tagline: "The series that started a universe.",
  description:
    "When the cosmos cracks, only an unlikely team of misfits stands between order and oblivion. The flagship Bazinga series returns with a new season.",
  background: heroBanner1,
  badges: ["NEW SEASON", "TOP 10 TODAY"],
};

const continueWatching: ContinueWatching[] = [
  { id: "cw1", title: "Heroes of Bazinga", episode: "S2:E4 The Edge of Forever", backdrop: heroBanner1, progress: 64, newEpisodes: true },
  { id: "cw2", title: "Shadow Legion", episode: "S1:E8 Last Light", backdrop: heroBanner2, progress: 32 },
  { id: "cw3", title: "Spirit of the Blade", episode: "S3:E2 The Cold Vow", backdrop: heroBanner3, progress: 88 },
  { id: "cw4", title: "Neon Knights", episode: "S2:E12 Velvet Static", backdrop: heroBanner2, progress: 15, newEpisodes: true },
  { id: "cw5", title: "Crimson Empire", episode: "S1:E3 Burnmark", backdrop: heroBanner3, progress: 50 },
];

const topTen: Show[] = [
  buildShow("top1", "Heroes of Bazinga", 0),
  buildShow("top2", "Crimson Empire", 1),
  buildShow("top3", "Shadow Legion", 2),
  buildShow("top4", "Neon Knights", 3),
  buildShow("top5", "Eternal Sentinels", 4),
  buildShow("top6", "Cosmic Showdown", 5),
  buildShow("top7", "Rogue Galaxy", 6),
  buildShow("top8", "Dark Horizon", 7),
  buildShow("top9", "Spirit of the Blade", 1),
  buildShow("top10", "Mecha Pulse", 3),
];

const trending: Show[] = [
  buildShow("t1", "Veil of Heroes", 4),
  buildShow("t2", "After Midnight City", 5),
  buildShow("t3", "Project Apex", 6),
  buildShow("t4", "Children of the Forge", 0),
  buildShow("t5", "Phantom Lattice", 5),
  buildShow("t6", "Hollow Suns", 6),
];

const anime: Show[] = [
  buildShow("a1", "Spirit of the Blade", 5),
  buildShow("a2", "Kaiju Academy", 6),
  buildShow("a3", "Neo Yokohama", 7),
  buildShow("a4", "Whispers of Bazu", 0),
  buildShow("a5", "Mecha Pulse", 1),
  buildShow("a6", "Starbound Wanderers", 2),
];

const originals: Show[] = [
  buildShow("o1", "The Bazinga Files", 3),
  buildShow("o2", "Veil of Heroes", 4),
  buildShow("o3", "After Midnight City", 5),
  buildShow("o4", "Project Apex", 6),
  buildShow("o5", "Echoes of the Tower", 7),
  buildShow("o6", "Children of the Forge", 0),
];

const newReleases: Show[] = [
  buildShow("n1", "Nightfall Protocol", 2),
  buildShow("n2", "Last Light of Eos", 3),
  buildShow("n3", "The Iron Vow", 4),
  buildShow("n4", "Phantom Lattice", 5),
  buildShow("n5", "Hollow Suns", 6),
  buildShow("n6", "Vermillion Wing", 7),
];

type Row = { title: string; shows: Show[] };

const rows: Row[] = [
  { title: "Trending Now", shows: trending },
  { title: "Bazinga Originals", shows: originals },
  { title: "Anime Universe", shows: anime },
  { title: "New & Noteworthy", shows: newReleases },
];

const scrollRail = (id: string, dir: -1 | 1) => () => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
};

const railId = (title: string) => `rail-${title.replace(/\s+/g, "-").toLowerCase()}`;

const ShowCard = ({ show, onSelect }: { show: Show; onSelect: (s: Show) => void }) => (
  <div className="relative shrink-0 w-40 md:w-52 snap-start" style={{ aspectRatio: "2 / 3" }}>
    <button
      type="button"
      onClick={() => onSelect(show)}
      className="group/card absolute inset-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md transition-all duration-300 ease-out hover:scale-[1.15] hover:z-30 origin-center"
    >
      <div className="relative h-full rounded-md overflow-hidden bg-card shadow-lg group-hover/card:shadow-2xl group-hover/card:shadow-orange-500/30 ring-0 group-hover/card:ring-2 group-hover/card:ring-orange-500/60 transition-shadow">
        <img
          src={show.poster}
          alt={show.title}
          className="h-full w-full object-cover transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

        {/* Default footer */}
        <div className="absolute bottom-2 left-2 right-2 transition-opacity duration-200 group-hover/card:opacity-0">
          <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-2">
            {show.title}
          </p>
          <p className="text-[10px] md:text-xs text-white/70 uppercase tracking-wider">
            {show.year} · {show.rating}
          </p>
        </div>

        {/* Hover preview overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300 bg-gradient-to-t from-black via-black/90 to-transparent">
          <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-2 mb-2">
            {show.title}
          </p>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="grid place-items-center h-7 w-7 rounded-full bg-white text-black hover:bg-white/85">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            <span className="grid place-items-center h-7 w-7 rounded-full border border-white/40 text-white hover:border-white">
              <Plus className="h-3.5 w-3.5" />
            </span>
            <span className="grid place-items-center h-7 w-7 rounded-full border border-white/40 text-white hover:border-white">
              <ThumbsUp className="h-3.5 w-3.5" />
            </span>
            <span className="ml-auto grid place-items-center h-7 w-7 rounded-full border border-white/40 text-white hover:border-white">
              <ChevronDown className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs">
            <span className="font-bold text-green-500">{show.matchPercent}% Match</span>
            <span className="border border-white/40 px-1 py-px text-white/80">{show.rating}</span>
            {show.seasons ? <span className="text-white/80">{show.seasons} Seasons</span> : null}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-1.5 text-[10px] text-white/70">
            {show.tags.map((t, i) => (
              <span key={t}>
                {t}
                {i < show.tags.length - 1 ? " ·" : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  </div>
);

const ShowRow = ({ row, onSelect }: { row: Row; onSelect: (s: Show) => void }) => {
  const id = railId(row.title);

  return (
    <section className="relative py-4 md:py-6" id={row.title.replace(/\s+/g, "-").toLowerCase()}>
      <div className="container mx-auto px-4 md:px-8 mb-3 flex items-center justify-between">
        <h3 className="text-xl md:text-2xl font-black tracking-tight">{row.title}</h3>
        <span className="text-xs font-semibold uppercase tracking-widest text-orange-500/80">
          Explore all
        </span>
      </div>
      <div className="relative group/row">
        <button
          type="button"
          onClick={scrollRail(id, -1)}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-r from-background via-background/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        <button
          type="button"
          onClick={scrollRail(id, 1)}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-l from-background via-background/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-8 w-8" />
        </button>

        <div
          id={id}
          className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-8 pb-10 pt-10 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {row.shows.map((show) => (
            <ShowCard key={show.id} show={show} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ContinueWatchingRow = ({ items }: { items: ContinueWatching[] }) => {
  const id = railId("continue-watching");
  return (
    <section className="relative py-4 md:py-6" id="continue-watching">
      <div className="container mx-auto px-4 md:px-8 mb-3">
        <h3 className="text-xl md:text-2xl font-black tracking-tight">Continue Watching</h3>
      </div>
      <div className="relative group/row">
        <button
          type="button"
          onClick={scrollRail(id, -1)}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-r from-background via-background/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        <button
          type="button"
          onClick={scrollRail(id, 1)}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-l from-background via-background/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
        <div
          id={id}
          className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-8 pb-6 pt-2 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="group/cw shrink-0 w-72 md:w-80 snap-start text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md overflow-hidden"
            >
              <div className="relative aspect-video overflow-hidden rounded-md bg-card shadow-lg transition-transform duration-300 group-hover/cw:scale-[1.03]">
                <img src={item.backdrop} alt={item.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Badges */}
                {item.newEpisodes && (
                  <span className="absolute top-2 left-2 bg-orange-500 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                    New Episodes
                  </span>
                )}

                {/* Hover play */}
                <div className="absolute inset-0 grid place-items-center opacity-0 group-hover/cw:opacity-100 transition-opacity">
                  <span className="grid place-items-center h-14 w-14 rounded-full bg-white/95 text-black shadow-2xl">
                    <Play className="h-6 w-6 fill-current" />
                  </span>
                </div>

                {/* Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-1">
                    {item.title}
                  </p>
                  <p className="text-[11px] md:text-xs text-white/80 line-clamp-1">{item.episode}</p>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const TopTenRow = ({ items, onSelect }: { items: Show[]; onSelect: (s: Show) => void }) => {
  const id = railId("top-10");
  return (
    <section className="relative py-4 md:py-6" id="top-10">
      <div className="container mx-auto px-4 md:px-8 mb-3 flex items-center gap-3">
        <span className="grid place-items-center h-7 w-7 rounded-sm bg-orange-500 text-black text-xs font-black">
          10
        </span>
        <h3 className="text-xl md:text-2xl font-black tracking-tight">Top 10 in Bazinga Today</h3>
      </div>
      <div className="relative group/row">
        <button
          type="button"
          onClick={scrollRail(id, -1)}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-r from-background via-background/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        <button
          type="button"
          onClick={scrollRail(id, 1)}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-l from-background via-background/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
        <div
          id={id}
          className="flex gap-2 md:gap-4 overflow-x-auto px-4 md:px-8 pb-10 pt-6 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((show, idx) => (
            <button
              key={show.id}
              type="button"
              onClick={() => onSelect(show)}
              className="group/top relative shrink-0 flex items-end snap-start outline-none"
            >
              {/* Big number */}
              <span
                className="font-black leading-[0.75] select-none pointer-events-none"
                style={{
                  fontSize: "clamp(140px, 22vw, 240px)",
                  WebkitTextStroke: "3px hsl(0 0% 100% / 0.45)",
                  color: "transparent",
                  fontFamily: "Inter, system-ui, sans-serif",
                  textShadow: "0 0 60px rgba(0,0,0,0.4)",
                }}
              >
                {idx + 1}
              </span>

              {/* Poster */}
              <div
                className="-ml-6 md:-ml-10 w-28 md:w-44 z-10 relative transition-transform duration-300 group-hover/top:scale-105"
                style={{ aspectRatio: "2 / 3" }}
              >
                <div className="relative h-full rounded-md overflow-hidden shadow-2xl ring-0 group-hover/top:ring-2 group-hover/top:ring-orange-500/70">
                  <img src={show.poster} alt={show.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs md:text-sm font-bold text-white line-clamp-2">{show.title}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const ShowModal = ({ show, onClose }: { show: Show; onClose: () => void }) => (
  <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
    <div className="relative w-full max-w-3xl rounded-xl overflow-hidden border border-orange-500/40 bg-card shadow-[0_0_60px_hsl(25_95%_55%/0.4)]">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="relative aspect-video">
        <img
          src={show.backdrop ?? show.poster}
          alt={show.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">{show.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/85">
            <span className="font-bold text-green-500">{show.matchPercent}% Match</span>
            <span>{show.year}</span>
            <span className="border border-white/40 px-2 py-0.5 text-xs">{show.rating}</span>
            {show.seasons ? <span>{show.seasons} Season{show.seasons > 1 ? "s" : ""}</span> : null}
          </div>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{show.description}</p>
        <div className="flex flex-wrap gap-3">
          <Button className="bg-orange-500 text-black hover:bg-orange-600 font-bold">
            <Play className="h-4 w-4 fill-current" /> Play
          </Button>
          <Button variant="outline" className="border-orange-500/60 text-orange-400 hover:bg-orange-500/10">
            <Plus className="h-4 w-4" /> My List
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/10">
            <ThumbsUp className="h-4 w-4" /> Like
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/10">
            <ThumbsDown className="h-4 w-4" /> Not for me
          </Button>
        </div>
        <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          <span className="text-white/70">Genres:</span>
          {show.genres.map((g, i) => (
            <span key={g} className="text-orange-400">
              {g}
              {i < show.genres.length - 1 ? "," : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const tvNavItems: SiteHeaderNavItem[] = [
  { label: "Home", href: "#continue-watching" },
  { label: "Series", href: "#bazinga-originals" },
  { label: "Anime", href: "#anime-universe" },
  { label: "New & Popular", href: "#new-noteworthy" },
  { label: "My List", href: "#top-10" },
  { label: "Comics", to: "/comics", tone: "red", emphasize: true },
];

const BazingaTV = () => {
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader
        brand={{ layout: "inline", accentText: "TV", accentColor: "orange" }}
        navItems={tvNavItems}
        avatarAccent="orange"
      />

      {/* Hero */}
      <section className="relative h-[80vh] min-h-[520px] -mt-16">
        <div className="absolute inset-0">
          <img src={heroFeatured.background} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, hsl(25 95% 55% / 0.18), transparent 60%)",
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto h-full px-4 md:px-8 flex items-end pb-16 md:pb-24">
          <div className="max-w-2xl space-y-5">
            <div className="flex flex-wrap gap-2">
              {heroFeatured.badges.map((b) => (
                <span
                  key={b}
                  className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-full px-3 py-1"
                >
                  {b}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95]">
              {heroFeatured.title}
            </h1>
            <p className="text-lg md:text-xl text-foreground/85 max-w-xl">{heroFeatured.tagline}</p>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              {heroFeatured.description}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-bold"
                onClick={() =>
                  setSelectedShow(
                    buildShow("hero", heroFeatured.title, 0, { description: heroFeatured.description })
                  )
                }
              >
                <Play className="h-5 w-5 fill-current" /> Play
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() =>
                  setSelectedShow(
                    buildShow("hero", heroFeatured.title, 0, { description: heroFeatured.description })
                  )
                }
              >
                <Info className="h-5 w-5" /> More Info
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Rows */}
      <main className="relative z-10 pt-4 md:pt-8 space-y-2 pb-20">
        <ContinueWatchingRow items={continueWatching} />
        <TopTenRow items={topTen} onSelect={(s) => setSelectedShow(s)} />
        {rows.map((row) => (
          <ShowRow key={row.title} row={row} onSelect={(s) => setSelectedShow(s)} />
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto px-4 md:px-8 text-sm text-muted-foreground flex flex-col md:flex-row gap-4 items-center justify-between">
          <p>©2025 BAZINGA TV. Streaming the multiverse.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground transition-colors">
              Switch experience
            </Link>
            <Link to="/comics" className="hover:text-foreground transition-colors">
              Bazinga Comics
            </Link>
          </div>
        </div>
      </footer>

      {selectedShow && <ShowModal show={selectedShow} onClose={() => setSelectedShow(null)} />}
    </div>
  );
};

export default BazingaTV;
