import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Play,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Sparkles,
} from "lucide-react";
import TVHeader from "@/components/TVHeader";
import TVHero from "@/components/TVHero";
import SuperheroShowsSection from "@/components/SuperheroShowsSection";
import AnimeModal from "@/components/AnimeModal";
import MediaRailCard from "@/components/MediaRailCard";
import {
  fetchSeasonNow,
  fetchSeasonUpcoming,
  fetchTopAnime,
  type AnimeDto,
} from "@/lib/metadata";
import { listMedia, type MediaItem } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/contexts/CollectionsContext";
import { hasTVAccess } from "@/lib/access";
import { cn } from "@/lib/utils";
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
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { isSaved, toggle } = useCollections();
  const { t } = useTranslation();
  const saved = isSaved("mylist", "anime", String(show.malId));
  const canWatch = hasTVAccess(user?.subscriptionType);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!canWatch) {
      navigate("/bazinga-unlimited");
      return;
    }
    navigate(`/bazinga-tv/watch/anime-${show.malId}`);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    void toggle("mylist", {
      kind: "anime",
      contentId: String(show.malId),
      title: show.title,
      image: show.largeImageUrl ?? show.imageUrl ?? null,
      subtitle: [show.year, ratingLabel(show)].filter(Boolean).join(" · "),
      payload: show,
    });
  };

  const handleMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(show);
  };

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
              {/* For comics-only viewers the Play chip turns into a Join-Now
                  shortcut so we never tease access they don't have. */}
              {user && !canWatch ? (
                <button
                  type="button"
                  onClick={handlePlay}
                  aria-label={t("header.joinNow")}
                  className="grid place-items-center h-7 w-7 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white hover:opacity-90 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlay}
                  aria-label={t("modal.play")}
                  className="grid place-items-center h-7 w-7 rounded-full bg-white text-black hover:bg-white/85 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </button>
              )}
              {token && (
                <button
                  type="button"
                  onClick={handleToggle}
                  aria-label={saved ? t("modal.inMyList") : t("modal.myList")}
                  className={cn(
                    "grid place-items-center h-7 w-7 rounded-full border text-white cursor-pointer transition-colors",
                    saved
                      ? "border-orange-500 bg-orange-500/30 text-orange-300 hover:bg-orange-500/40"
                      : "border-white/40 hover:border-white"
                  )}
                >
                  {saved ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              )}
              <button
                type="button"
                onClick={handleMore}
                aria-label={t("modal.moreInfo")}
                className="ml-auto grid place-items-center h-7 w-7 rounded-full border border-white/40 text-white hover:border-white cursor-pointer"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs">
              <span className="font-bold text-green-500">{matchPercent(show)}% {t("modal.match")}</span>
              <span className="border border-white/40 px-1 py-px text-white/80">{rating}</span>
              {seasons ? (
                <span className="text-white/80">
                  {seasons} {seasons > 1 ? t("modal.seasons") : t("modal.season")}
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
  exploreHref,
  children,
  id,
  loading,
  empty,
  rows = 2,
}: {
  title: string;
  badge?: React.ReactNode;
  exploreLabel?: string;
  /** Optional destination for the "Explore all" affordance. */
  exploreHref?: string;
  id: string;
  loading?: boolean;
  empty?: boolean;
  /** 2 = double-height scroller (default), 1 = single row. */
  rows?: 1 | 2;
  children: React.ReactNode;
}) => (
  <section className="relative py-4 md:py-6" id={id}>
    <div className="container mx-auto px-4 md:px-8 mb-3 flex items-center justify-between">
      <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
        {badge}
        {title}
      </h3>
      {exploreLabel && (
        exploreHref ? (
          <Link
            to={exploreHref}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
          >
            {exploreLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-500/80">
            {exploreLabel}
          </span>
        )
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
        className={cn(
          "overflow-x-auto px-4 md:px-8 pb-10 pt-10 scroll-smooth no-scrollbar",
          rows === 2
            ? "grid grid-rows-2 grid-flow-col auto-cols-max gap-x-3 gap-y-4 md:gap-x-4"
            : "flex gap-3 md:gap-4 snap-x snap-mandatory"
        )}
        style={{ scrollbarWidth: "none" }}
      >
        {loading ? (
          <div className="px-4 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : empty ? (
          <p className="px-4 text-sm text-muted-foreground">
            Nothing here yet — try a different filter.
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  </section>
);

/** DB-only row used for movies (no Jikan / TVMaze counterpart for movies). */
const MoviesRow = ({ movies }: { movies: MediaItem[] }) => {
  const id = "bazinga-movies";
  const { t } = useTranslation();
  return (
    <RowChrome id={id} title={t("tvHome.movies")} rows={2} empty={movies.length === 0}>
      {movies.map((m) => (
        <MediaRailCard key={`m-${m.id}`} item={m} />
      ))}
    </RowChrome>
  );
};

const ShowRow = ({
  title,
  items,
  onSelect,
  loading,
  badge,
  exploreLabel,
  exploreHref = "/bazinga-tv/anime",
  rows = 2,
  // DB-backed media items prepend the rail so admin-added titles ("Berserk"
  // etc.) sit at position 1 ahead of the Jikan / TVMaze cards.
  originals = [],
}: {
  title: string;
  items: AnimeDto[];
  onSelect: (a: AnimeDto) => void;
  loading?: boolean;
  badge?: React.ReactNode;
  exploreLabel?: string;
  exploreHref?: string;
  rows?: 1 | 2;
  originals?: MediaItem[];
}) => (
  <RowChrome
    id={railId(title)}
    title={title}
    badge={badge}
    exploreLabel={exploreLabel}
    exploreHref={exploreHref}
    rows={rows}
    loading={loading}
    empty={!loading && items.length === 0 && originals.length === 0}
  >
    {originals.map((m) => (
      <MediaRailCard key={`m-${m.id}`} item={m} />
    ))}
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
  const { t } = useTranslation();
  return (
    <section className="relative py-4 md:py-6" id={id}>
      <div className="container mx-auto px-4 md:px-8 mb-3">
        <h3 className="text-xl md:text-2xl font-black tracking-tight">{t("tvHome.continueWatching")}</h3>
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
          className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-8 pb-6 pt-2 scroll-smooth snap-x snap-mandatory no-scrollbar"
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
                      {t("tvHome.newEpisodes")}
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
                      {t("tvHome.episodeOf", { ep, total: item.episodes ?? "—" })}
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
  const { t } = useTranslation();
  return (
    <section className="relative py-4 md:py-6" id={id}>
      <div className="container mx-auto px-4 md:px-8 mb-3 flex items-center gap-3">
        <span className="grid place-items-center h-7 w-7 rounded-sm bg-orange-500 text-black text-xs font-black">
          10
        </span>
        <h3 className="text-xl md:text-2xl font-black tracking-tight">{t("tvHome.topTen")}</h3>
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
          className="flex gap-2 md:gap-4 overflow-x-auto px-4 md:px-8 pb-10 pt-6 scroll-smooth snap-x snap-mandatory no-scrollbar"
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
// Page
// ---------------------------------------------------------------------------

const BazingaTV = () => {
  const [selectedShow, setSelectedShow] = useState<AnimeDto | null>(null);
  const { t } = useTranslation();

  const topAnime = useQuery({
    queryKey: ["anime-top"],
    queryFn: () => fetchTopAnime(1, 20),
    staleTime: 15 * 60 * 1000,
  });
  const seasonNow = useQuery({
    queryKey: ["anime-season-now"],
    queryFn: () => fetchSeasonNow(1, 18),
    staleTime: 15 * 60 * 1000,
  });
  const seasonUpcoming = useQuery({
    queryKey: ["anime-season-upcoming"],
    queryFn: () => fetchSeasonUpcoming(1, 18),
    staleTime: 15 * 60 * 1000,
  });

  // Admin-added (DB) items prepend the rails by kind so they always sit in
  // front of the external Jikan / TVMaze cards.
  const dbAnime = useQuery({
    queryKey: ["media", "list", "anime"],
    queryFn: () => listMedia("anime"),
    staleTime: 5 * 60 * 1000,
  });
  const dbShows = useQuery({
    queryKey: ["media", "list", "show"],
    queryFn: () => listMedia("show"),
    staleTime: 5 * 60 * 1000,
  });
  const dbMovies = useQuery({
    queryKey: ["media", "list", "movie"],
    queryFn: () => listMedia("movie"),
    staleTime: 5 * 60 * 1000,
  });

  // "Continue watching" is fake — we don't track real progress yet — but we
  // pull the titles/posters from the same top-anime fetch so it doesn't feel
  // disconnected.
  const continueWatching = topAnime.data?.data.slice(0, 8) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TVHeader />

      {/* Hero trailer carousel (real local trailer videos) */}
      <TVHero />

      {/* Rows */}
      <main className="relative z-10 pt-2 md:pt-4 space-y-2 pb-20">
        <ContinueWatchingRow
          items={continueWatching}
          onSelect={(s) => setSelectedShow(s)}
        />
        <TopTenRow items={topAnime.data?.data ?? []} onSelect={(s) => setSelectedShow(s)} />
        <ShowRow
          title={t("tvHome.trendingNow")}
          items={seasonNow.data?.data ?? []}
          onSelect={(s) => setSelectedShow(s)}
          loading={seasonNow.isLoading}
          rows={1}
          exploreLabel={t("tvHome.exploreAll")}
        />
        <SuperheroShowsSection originals={dbShows.data ?? []} />
        <ShowRow
          title={t("tvHome.animeUniverse")}
          items={topAnime.data?.data ?? []}
          onSelect={(s) => setSelectedShow(s)}
          loading={topAnime.isLoading}
          exploreLabel={t("tvHome.exploreAll")}
          originals={dbAnime.data ?? []}
        />
        {(dbMovies.data?.length ?? 0) > 0 && (
          <MoviesRow movies={dbMovies.data ?? []} />
        )}
        <ShowRow
          title={t("tvHome.newNoteworthy")}
          items={seasonUpcoming.data?.data ?? []}
          onSelect={(s) => setSelectedShow(s)}
          loading={seasonUpcoming.isLoading}
          exploreLabel={t("tvHome.exploreAll")}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto px-4 md:px-8 text-sm text-muted-foreground flex flex-col md:flex-row gap-4 items-center justify-between">
          <p>©2025 BAZINGA TV.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground transition-colors">
              {t("choice.chooseExperience")}
            </Link>
            <Link to="/comics" className="hover:text-foreground transition-colors">
              {t("header.comics")}
            </Link>
          </div>
        </div>
      </footer>

      {selectedShow && <AnimeModal anime={selectedShow} onClose={() => setSelectedShow(null)} />}
    </div>
  );
};

export default BazingaTV;
