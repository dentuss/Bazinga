import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Plus,
  ChevronRight,
  ChevronLeft,
  Info,
  Search,
  Bell,
  User,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
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
  year: number;
  rating: string;
  seasons?: number;
  genres: string[];
  description: string;
};

const posters = [comic1, comic2, comic3, comic4, comic5, comic6, comic7, comic8];

const buildShow = (
  id: string,
  title: string,
  index: number,
  meta: Partial<Show> = {}
): Show => ({
  id,
  title,
  poster: posters[index % posters.length],
  year: 2024 - (index % 5),
  rating: ["TV-14", "TV-MA", "TV-PG"][index % 3],
  seasons: 1 + (index % 4),
  genres: ["Action", "Sci-Fi", "Anime"].slice(0, 2 + (index % 2)),
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

const trending: Show[] = [
  buildShow("t1", "Heroes of Bazinga", 0),
  buildShow("t2", "Crimson Empire", 1),
  buildShow("t3", "Shadow Legion", 2),
  buildShow("t4", "Neon Knights", 3),
  buildShow("t5", "Eternal Sentinels", 4),
  buildShow("t6", "Cosmic Showdown", 5),
  buildShow("t7", "Rogue Galaxy", 6),
  buildShow("t8", "Dark Horizon", 7),
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

const ShowRow = ({ row, onSelect }: { row: Row; onSelect: (s: Show) => void }) => {
  const scrollRef = (id: string) => (dir: -1 | 1) => () => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  const railId = `rail-${row.title.replace(/\s+/g, "-").toLowerCase()}`;
  const scroll = scrollRef(railId);

  return (
    <section className="relative py-4 md:py-6">
      <div className="container mx-auto px-4 mb-3 flex items-center justify-between">
        <h3 className="text-xl md:text-2xl font-black tracking-tight">{row.title}</h3>
        <span className="text-xs font-semibold uppercase tracking-widest text-orange-500/80">
          Explore all
        </span>
      </div>
      <div className="relative group/row">
        <button
          type="button"
          onClick={scroll(-1)}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-r from-background via-background/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        <button
          type="button"
          onClick={scroll(1)}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-l from-background via-background/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-8 w-8" />
        </button>

        <div
          id={railId}
          className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-8 pb-2 scroll-smooth snap-x snap-mandatory"
        >
          {row.shows.map((show) => (
            <button
              key={show.id}
              type="button"
              onClick={() => onSelect(show)}
              className="group/card relative shrink-0 w-40 md:w-56 snap-start text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md overflow-hidden"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-card">
                <img
                  src={show.poster}
                  alt={show.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-2">
                    {show.title}
                  </p>
                  <p className="text-[10px] md:text-xs text-white/70 uppercase tracking-wider">
                    {show.year} · {show.rating}
                  </p>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 ring-2 ring-orange-500 rounded-md" />
                <div
                  className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: "0 0 30px hsl(25 95% 55% / 0.55)" }}
                />
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
        <img src={show.poster} alt={show.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">{show.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span>{show.year}</span>
            <span className="border border-white/40 px-2 py-0.5 text-xs">{show.rating}</span>
            {show.seasons ? <span>{show.seasons} Season{show.seasons > 1 ? "s" : ""}</span> : null}
            {show.genres.map((g) => (
              <span key={g} className="text-orange-400">
                · {g}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{show.description}</p>
        <div className="flex flex-wrap gap-3">
          <Button className="bg-orange-500 text-black hover:bg-orange-600 font-bold">
            <Play className="h-4 w-4" /> Play
          </Button>
          <Button variant="outline" className="border-orange-500/60 text-orange-400 hover:bg-orange-500/10">
            <Plus className="h-4 w-4" /> My List
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const BazingaTV = () => {
  const { user } = useAuth();
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-background via-background/85 to-transparent backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tighter text-primary">BAZINGA</span>
              <span className="text-2xl font-black tracking-tighter text-orange-500">TV</span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-sm font-semibold text-foreground/80">
              <a href="#trending-now" className="hover:text-foreground transition-colors">
                Home
              </a>
              <a href="#bazinga-originals" className="hover:text-foreground transition-colors">
                Originals
              </a>
              <a href="#anime-universe" className="hover:text-foreground transition-colors">
                Anime
              </a>
              <a href="#new-noteworthy" className="hover:text-foreground transition-colors">
                New
              </a>
              <Link to="/comics" className="hover:text-foreground transition-colors">
                Comics
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="hidden sm:flex">
              <Bell className="h-5 w-5" />
            </Button>
            {user ? (
              <Link to="/profile" aria-label="Profile">
                <Avatar className="h-9 w-9 border border-orange-500/40 ring-1 ring-orange-500/30">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.username} /> : null}
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link to="/auth">
                <Button className="bg-orange-500 text-black hover:bg-orange-600 font-bold">
                  Sign In
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

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

        <div className="relative z-10 container mx-auto h-full px-4 flex items-end pb-16 md:pb-24">
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
                className="bg-orange-500 text-black hover:bg-orange-600 font-bold shadow-[0_0_30px_hsl(25_95%_55%/0.6)]"
                onClick={() =>
                  setSelectedShow(buildShow("hero", heroFeatured.title, 0, { description: heroFeatured.description }))
                }
              >
                <Play className="h-5 w-5" /> Play
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() =>
                  setSelectedShow(buildShow("hero", heroFeatured.title, 0, { description: heroFeatured.description }))
                }
              >
                <Info className="h-5 w-5" /> More Info
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Rows */}
      <main className="relative z-10 -mt-16 md:-mt-24 space-y-2 pb-20">
        {rows.map((row) => (
          <div id={row.title.replace(/\s+/g, "-").toLowerCase()} key={row.title}>
            <ShowRow row={row} onSelect={(s) => setSelectedShow(s)} />
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto px-4 text-sm text-muted-foreground flex flex-col md:flex-row gap-4 items-center justify-between">
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

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-screen w-[85%] max-w-xs bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <span className="text-lg font-bold">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {rows.map((row) => (
                <a
                  key={row.title}
                  href={`#${row.title.replace(/\s+/g, "-").toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground"
                >
                  {row.title}
                </a>
              ))}
              <Link
                to="/comics"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                Bazinga Comics
              </Link>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                Switch experience
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default BazingaTV;
