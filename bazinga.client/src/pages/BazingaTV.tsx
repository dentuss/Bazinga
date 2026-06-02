import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Search,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SiteHeader, { type SiteHeaderNavItem } from "@/components/SiteHeader";
import TVHero from "@/components/TVHero";
import {
  fetchAnime,
  fetchAnimeGenres,
  fetchSeasonNow,
  fetchSeasonUpcoming,
  fetchTopAnime,
  searchAnime,
  type AnimeDto,
  type GenreDto,
} from "@/lib/metadata";
import heroBanner1 from "@/assets/hero-banner-1.jpg";
import heroBanner2 from "@/assets/hero-banner-2.jpg";
import heroBanner3 from "@/assets/hero-banner-3.jpg";

const fallbackBackdrops = [heroBanner1, heroBanner2, heroBanner3];
const backdropFor = (id: number) => fallbackBackdrops[id % fallbackBackdrops.length];

// Synthesise the Top-of-mind "match %" and "tags" Netflix-style chrome from
// real Jikan data so the cards look complete without inventing extra requests.
const matchPercent = (a: AnimeDto): number => {
  if (typeof a.score === "number") return Math.max(70, Math.min(99, Math.round(a.score * 10)));
  return 78 + ((a.malId * 3) % 22);
};

const ratingLabel = (a: AnimeDto): string => {
  if (a.rating) return a.rating.split(" ")[0];
  if (a.type === "Movie") return "MOV";
  return "TV";
};

const yearLabel = (a: AnimeDto): string =>
  a.year ? String(a.year) : a.status ?? "—";

const seasonCount = (a: AnimeDto): number | null => {
  if (!a.episodes) return null;
  if (a.episodes <= 26) return 1;
  if (a.episodes <= 52) return 2;
  return Math.min(5, Math.ceil(a.episodes / 24));
};

// ---------------------------------------------------------------------------
// Card / Row primitives
// ---------------------------------------------------------------------------

const scrollRail = (id: string, dir: -1 | 1) => () => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
};

const railId = (title: string) => `rail-${title.replace(/\s+/g, "-").toLowerCase()}`;

const AnimeCard = ({
  show,
  onSelect,
}: {
  show: AnimeDto;
  onSelect: (s: AnimeDto) => void;
}) => {
  const poster = show.largeImageUrl ?? show.imageUrl ?? backdropFor(show.malId);
  const seasons = seasonCount(show);
  const rating = ratingLabel(show);

  return (
    <div className="relative shrink-0 w-40 md:w-52 snap-start" style={{ aspectRatio: "2 / 3" }}>
      <button
        type="button"
        onClick={() => onSelect(show)}
        className="group/card absolute inset-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md transition-all duration-300 ease-out hover:scale-[1.15] hover:z-30 origin-center"
      >
        <div className="relative h-full rounded-md overflow-hidden bg-card shadow-lg group-hover/card:shadow-2xl group-hover/card:shadow-orange-500/30 ring-0 group-hover/card:ring-2 group-hover/card:ring-orange-500/60 transition-shadow">
          <img
            src={poster}
            alt={show.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* Default footer */}
          <div className="absolute bottom-2 left-2 right-2 transition-opacity duration-200 group-hover/card:opacity-0">
            <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-2">
              {show.title}
            </p>
            <p className="text-[10px] md:text-xs text-white/70 uppercase tracking-wider">
              {yearLabel(show)} · {rating}
            </p>
          </div>

          {/* Hover overlay */}
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
              <span className="font-bold text-green-500">{matchPercent(show)}% Match</span>
              <span className="border border-white/40 px-1 py-px text-white/80">{rating}</span>
              {seasons ? (
                <span className="text-white/80">
                  {seasons} Season{seasons > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-1.5 text-[10px] text-white/70">
              {show.genres.slice(0, 3).map((g, i) => (
                <span key={g}>
                  {g}
                  {i < Math.min(2, show.genres.length - 1) ? " ·" : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

const RowChrome = ({
  title,
  badge,
  exploreLabel,
  children,
  id,
  loading,
  empty,
}: {
  title: string;
  badge?: React.ReactNode;
  exploreLabel?: string;
  id: string;
  loading?: boolean;
  empty?: boolean;
  children: React.ReactNode;
}) => (
  <section className="relative py-4 md:py-6" id={id}>
    <div className="container mx-auto px-4 md:px-8 mb-3 flex items-center justify-between">
      <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
        {badge}
        {title}
      </h3>
      {exploreLabel && (
        <span className="text-xs font-semibold uppercase tracking-widest text-orange-500/80">
          {exploreLabel}
        </span>
      )}
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
        {loading ? (
          <div className="container mx-auto px-4 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : empty ? (
          <p className="container mx-auto px-4 text-sm text-muted-foreground">
            Nothing here yet — try a different filter.
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  </section>
);

const ShowRow = ({
  title,
  items,
  onSelect,
  loading,
  badge,
  exploreLabel = "Explore all",
}: {
  title: string;
  items: AnimeDto[];
  onSelect: (a: AnimeDto) => void;
  loading?: boolean;
  badge?: React.ReactNode;
  exploreLabel?: string;
}) => (
  <RowChrome
    id={railId(title)}
    title={title}
    badge={badge}
    exploreLabel={exploreLabel}
    loading={loading}
    empty={!loading && items.length === 0}
  >
    {items.map((show) => (
      <AnimeCard key={show.malId} show={show} onSelect={onSelect} />
    ))}
  </RowChrome>
);

const ContinueWatchingRow = ({
  items,
  onSelect,
}: {
  items: AnimeDto[];
  onSelect: (a: AnimeDto) => void;
}) => {
  const id = "continue-watching";
  return (
    <section className="relative py-4 md:py-6" id={id}>
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
          {items.map((item, idx) => {
            const backdrop =
              item.trailerImageUrl ?? item.largeImageUrl ?? item.imageUrl ?? backdropFor(item.malId);
            const progress = 18 + ((item.malId * 7 + idx * 11) % 73);
            const newEpisodes = idx % 3 === 0;
            const ep = 1 + (item.malId % (item.episodes ?? 12));
            return (
              <button
                key={item.malId}
                type="button"
                onClick={() => onSelect(item)}
                className="group/cw shrink-0 w-72 md:w-80 snap-start text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md overflow-hidden"
              >
                <div className="relative aspect-video overflow-hidden rounded-md bg-card shadow-lg transition-transform duration-300 group-hover/cw:scale-[1.03]">
                  <img src={backdrop} alt={item.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  {newEpisodes && (
                    <span className="absolute top-2 left-2 bg-orange-500 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                      New Episodes
                    </span>
                  )}
                  <div className="absolute inset-0 grid place-items-center opacity-0 group-hover/cw:opacity-100 transition-opacity">
                    <span className="grid place-items-center h-14 w-14 rounded-full bg-white/95 text-black shadow-2xl">
                      <Play className="h-6 w-6 fill-current" />
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-1">
                      {item.title}
                    </p>
                    <p className="text-[11px] md:text-xs text-white/80 line-clamp-1">
                      Episode {ep} of {item.episodes ?? "—"}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
                    <div className="h-full bg-orange-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const TopTenRow = ({
  items,
  onSelect,
}: {
  items: AnimeDto[];
  onSelect: (a: AnimeDto) => void;
}) => {
  const id = "top-10";
  return (
    <section className="relative py-4 md:py-6" id={id}>
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
          {items.slice(0, 10).map((show, idx) => (
            <button
              key={show.malId}
              type="button"
              onClick={() => onSelect(show)}
              className="group/top relative shrink-0 flex items-end snap-start outline-none"
            >
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
              <div
                className="-ml-6 md:-ml-10 w-28 md:w-44 z-10 relative transition-transform duration-300 group-hover/top:scale-105"
                style={{ aspectRatio: "2 / 3" }}
              >
                <div className="relative h-full rounded-md overflow-hidden shadow-2xl ring-0 group-hover/top:ring-2 group-hover/top:ring-orange-500/70">
                  <img
                    src={show.largeImageUrl ?? show.imageUrl ?? backdropFor(show.malId)}
                    alt={show.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs md:text-sm font-bold text-white line-clamp-2">
                      {show.title}
                    </p>
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

// ---------------------------------------------------------------------------
// Show modal (detail fetched from /api/metadata/anime/{id})
// ---------------------------------------------------------------------------

const ShowModal = ({
  show,
  onClose,
}: {
  show: AnimeDto;
  onClose: () => void;
}) => {
  const { data: detail } = useQuery({
    queryKey: ["anime-detail", show.malId],
    queryFn: () => fetchAnime(show.malId),
    staleTime: 10 * 60 * 1000,
  });
  const full = detail ?? show;
  const backdrop =
    full.trailerImageUrl ?? full.largeImageUrl ?? full.imageUrl ?? backdropFor(full.malId);
  const seasons = seasonCount(full);

  return (
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
          <img src={backdrop} alt={full.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">{full.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/85">
              <span className="font-bold text-green-500">{matchPercent(full)}% Match</span>
              {full.year && <span>{full.year}</span>}
              <span className="border border-white/40 px-2 py-0.5 text-xs">{ratingLabel(full)}</span>
              {seasons ? (
                <span>
                  {seasons} Season{seasons > 1 ? "s" : ""}
                </span>
              ) : full.episodes ? (
                <span>{full.episodes} episodes</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {full.synopsis ?? "No synopsis yet."}
          </p>
          {full.studios.length > 0 && (
            <p className="text-xs text-white/70">
              <span className="text-white/50 mr-1">Studios:</span>
              {full.studios.join(", ")}
            </p>
          )}
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
            {full.genres.map((g, i) => (
              <span key={g} className="text-orange-400">
                {g}
                {i < full.genres.length - 1 ? "," : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Search overlay
// ---------------------------------------------------------------------------

const SearchOverlay = ({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (a: AnimeDto) => void;
}) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ["anime-search", debouncedQuery],
    queryFn: () => searchAnime({ q: debouncedQuery, limit: 18 }),
    enabled: open && debouncedQuery.length > 1,
    staleTime: 60 * 1000,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="container mx-auto px-4 md:px-8 pt-20 md:pt-28 max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime titles, e.g. 'frieren', 'cowboy bebop'…"
            className="h-14 pl-12 pr-14 text-base bg-card/90 border-border/80"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-muted hover:bg-muted/80"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">
          {debouncedQuery.length < 2 ? (
            <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
          ) : isFetching && !data ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : data && data.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches for "{debouncedQuery}".</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 max-h-[60vh] overflow-y-auto pb-6">
              {data?.data.map((a) => (
                <button
                  key={a.malId}
                  type="button"
                  onClick={() => {
                    onSelect(a);
                    onClose();
                  }}
                  className="group text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md"
                >
                  <div className="relative rounded-md overflow-hidden bg-card" style={{ aspectRatio: "2 / 3" }}>
                    <img
                      src={a.largeImageUrl ?? a.imageUrl ?? backdropFor(a.malId)}
                      alt={a.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs font-bold text-white line-clamp-2">{a.title}</p>
                      <p className="text-[10px] text-white/70 uppercase">{yearLabel(a)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Genre filter
// ---------------------------------------------------------------------------

const GenreBar = ({
  genres,
  activeId,
  onChange,
}: {
  genres: GenreDto[];
  activeId: number | null;
  onChange: (id: number | null) => void;
}) => {
  // Curated list — only show high-signal genres so the bar is scannable.
  const curated = useMemo(() => {
    const preferred = [
      "Action",
      "Adventure",
      "Comedy",
      "Drama",
      "Fantasy",
      "Mystery",
      "Romance",
      "Sci-Fi",
      "Slice of Life",
      "Supernatural",
      "Sports",
      "Horror",
    ];
    return genres
      .filter((g) => preferred.includes(g.name))
      .sort((a, b) => preferred.indexOf(a.name) - preferred.indexOf(b.name));
  }, [genres]);

  if (curated.length === 0) return null;

  return (
    <div className="container mx-auto px-4 md:px-8 mt-2 mb-1 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`shrink-0 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
          activeId === null
            ? "bg-orange-500 text-black border-orange-500"
            : "bg-transparent text-white/80 border-white/20 hover:border-white/60"
        }`}
      >
        All
      </button>
      {curated.map((g) => (
        <button
          key={g.malId}
          type="button"
          onClick={() => onChange(g.malId)}
          className={`shrink-0 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
            activeId === g.malId
              ? "bg-orange-500 text-black border-orange-500"
              : "bg-transparent text-white/80 border-white/20 hover:border-white/60"
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const tvNavItems: SiteHeaderNavItem[] = [
  { label: "Home", href: "#continue-watching" },
  { label: "Series", href: "#bazinga-originals" },
  { label: "Anime", href: "#anime-universe" },
  { label: "New & Popular", href: "#new-noteworthy" },
  { label: "My List", href: "#top-10" },
  { label: "Comics", to: "/comics", tone: "red", emphasize: true },
];

const BazingaTV = () => {
  const [selectedShow, setSelectedShow] = useState<AnimeDto | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);

  // Open the search overlay with Ctrl/Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const topAnime = useQuery({
    queryKey: ["anime-top"],
    queryFn: () => fetchTopAnime(1, 20),
    staleTime: 15 * 60 * 1000,
  });
  const seasonNow = useQuery({
    queryKey: ["anime-season-now"],
    queryFn: () => fetchSeasonNow(1, 16),
    staleTime: 15 * 60 * 1000,
  });
  const seasonUpcoming = useQuery({
    queryKey: ["anime-season-upcoming"],
    queryFn: () => fetchSeasonUpcoming(1, 16),
    staleTime: 15 * 60 * 1000,
  });
  const animeOriginals = useQuery({
    queryKey: ["anime-originals"],
    queryFn: () => searchAnime({ orderBy: "popularity", limit: 16 }),
    staleTime: 15 * 60 * 1000,
  });
  const filteredAnime = useQuery({
    queryKey: ["anime-by-genre", activeGenre ?? "all"],
    queryFn: () =>
      activeGenre
        ? searchAnime({ genre: activeGenre, orderBy: "score", limit: 18 })
        : searchAnime({ orderBy: "score", limit: 18 }),
    staleTime: 15 * 60 * 1000,
  });
  const genres = useQuery({
    queryKey: ["anime-genres"],
    queryFn: fetchAnimeGenres,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // "Continue watching" is fake — we don't track real progress yet — but we
  // pull the titles/posters from the same top-anime fetch so it doesn't feel
  // disconnected.
  const continueWatching = topAnime.data?.data.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader
        brand={{ layout: "inline", accentText: "TV", accentColor: "orange" }}
        navItems={tvNavItems}
        avatarAccent="orange"
      />

      {/* Hero trailer carousel (real local trailer videos) */}
      <TVHero />

      {/* Search + genre filter bar */}
      <div className="container mx-auto px-4 md:px-8 mt-6 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-orange-500/80">
          Browse
        </h2>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/85 hover:border-white/60 hover:text-white transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          Search anime
          <span className="hidden md:inline-block text-[10px] text-white/40 ml-2 px-1 py-px border border-white/20 rounded">
            Ctrl K
          </span>
        </button>
      </div>
      <GenreBar
        genres={genres.data ?? []}
        activeId={activeGenre}
        onChange={setActiveGenre}
      />

      {/* Rows */}
      <main className="relative z-10 pt-2 md:pt-4 space-y-2 pb-20">
        <ContinueWatchingRow
          items={continueWatching}
          onSelect={(s) => setSelectedShow(s)}
        />
        <TopTenRow items={topAnime.data?.data ?? []} onSelect={(s) => setSelectedShow(s)} />
        <ShowRow
          title="Trending Now"
          items={seasonNow.data?.data ?? []}
          onSelect={(s) => setSelectedShow(s)}
          loading={seasonNow.isLoading}
        />
        <ShowRow
          title="Bazinga Originals"
          items={animeOriginals.data?.data ?? []}
          onSelect={(s) => setSelectedShow(s)}
          loading={animeOriginals.isLoading}
        />
        <ShowRow
          title={activeGenre ? "Anime Universe · Filtered" : "Anime Universe"}
          items={filteredAnime.data?.data ?? []}
          onSelect={(s) => setSelectedShow(s)}
          loading={filteredAnime.isLoading}
        />
        <ShowRow
          title="New & Noteworthy"
          items={seasonUpcoming.data?.data ?? []}
          onSelect={(s) => setSelectedShow(s)}
          loading={seasonUpcoming.isLoading}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto px-4 md:px-8 text-sm text-muted-foreground flex flex-col md:flex-row gap-4 items-center justify-between">
          <p>©2025 BAZINGA TV. Streaming the multiverse. Metadata via Jikan / MyAnimeList.</p>
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
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(a) => setSelectedShow(a)}
      />
    </div>
  );
};

export default BazingaTV;
