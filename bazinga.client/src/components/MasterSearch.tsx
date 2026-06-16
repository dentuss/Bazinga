import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, Search, Sparkles, X } from "lucide-react";
import {
  fetchSuperheroes,
  searchAnime,
  searchManga,
  superheroSubtitle,
  type AnimeDto,
  type MangaDto,
  type SuperheroDto,
} from "@/lib/metadata";
import {
  placeholderComics,
  type PlaceholderComic,
} from "@/data/placeholderComics";
import MangaModal from "@/components/MangaModal";
import HeroModal from "@/components/HeroModal";
import ComicModal from "@/components/ComicModal";
import AnimeModal from "@/components/AnimeModal";
import { cn } from "@/lib/utils";

interface MasterSearchProps {
  open: boolean;
  onClose: () => void;
}

const PROMPTS = ["Berserk", "Spider-Man", "Cowboy Bebop"] as const;

const MasterSearch = ({ open, onClose }: MasterSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Modals popped from the search itself — so clicking a result opens the
  // detail right here instead of bouncing to a catalog page.
  const [openComic, setOpenComic] = useState<PlaceholderComic | null>(null);
  const [openHero, setOpenHero] = useState<SuperheroDto | null>(null);
  const [openManga, setOpenManga] = useState<MangaDto | null>(null);
  const [openAnime, setOpenAnime] = useState<AnimeDto | null>(null);

  // Reset on close; bind Escape while open.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
      setOpenComic(null);
      setOpenHero(null);
      setOpenManga(null);
      setOpenAnime(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Layered close: dismiss top-most modal first, then the overlay.
        if (openComic) return setOpenComic(null);
        if (openHero) return setOpenHero(null);
        if (openManga) return setOpenManga(null);
        if (openAnime) return setOpenAnime(null);
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, openComic, openHero, openManga, openAnime]);

  // Debounce typing.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const comicMatches = useMemo<PlaceholderComic[]>(() => {
    if (!debounced) return [];
    const q = debounced.toLowerCase();
    return placeholderComics
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.series.toLowerCase().includes(q) ||
          c.character.toLowerCase().includes(q) ||
          c.creators.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [debounced]);

  const enabled = debounced.length > 1;

  const heroes = useQuery({
    queryKey: ["master-search:characters", debounced],
    queryFn: () => fetchSuperheroes({ q: debounced, limit: 5 }),
    enabled,
    staleTime: 60 * 1000,
  });

  const manga = useQuery({
    queryKey: ["master-search:manga", debounced],
    queryFn: () => searchManga({ q: debounced, limit: 5 }),
    enabled,
    staleTime: 60 * 1000,
  });

  const anime = useQuery({
    queryKey: ["master-search:anime", debounced],
    queryFn: () => searchAnime({ q: debounced, limit: 5 }),
    enabled,
    staleTime: 60 * 1000,
  });

  const totalLoading = heroes.isFetching || manga.isFetching || anime.isFetching;
  const heroHits = heroes.data?.data ?? [];
  const mangaHits = manga.data?.data ?? [];
  const animeHits = anime.data?.data ?? [];
  const empty =
    enabled &&
    !totalLoading &&
    comicMatches.length === 0 &&
    heroHits.length === 0 &&
    mangaHits.length === 0 &&
    animeHits.length === 0;

  const goToFiltered = (target: "comics" | "characters" | "manga" | "anime") => {
    const q = encodeURIComponent(debounced);
    onClose();
    if (target === "comics") navigate(`/comics/all?search=${q}`);
    else if (target === "characters") navigate(`/characters?q=${q}`);
    else if (target === "manga") navigate(`/manga?q=${q}`);
    else navigate(`/bazinga-tv/anime?q=${q}`);
  };

  if (!open) return null;

  const overlay = (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col overflow-hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Search Bazinga"
      onClick={onClose}
    >
      {/* Top strip — title + close + input. Bound by the viewport, not the page container. */}
      <div
        className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-6 md:pt-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-primary">
            Search Bazinga
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-card hover:bg-muted border border-border/60 flex items-center justify-center transition-colors"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search comics, characters, manga, anime…"
            className="w-full h-14 md:h-16 rounded-xl bg-card border-2 border-border pl-12 pr-12 text-base md:text-lg font-semibold outline-none focus:border-primary focus:shadow-[0_0_30px_hsl(0_82%_55%/0.3)] transition-all placeholder:text-muted-foreground/70"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted grid place-items-center transition-colors"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          ) : totalLoading ? (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-bold text-foreground">
            Esc
          </kbd>{" "}
          to close
        </p>
      </div>

      {/* Body — prompts when idle, grouped results otherwise. */}
      <div
        className="flex-1 overflow-y-auto pt-4 pb-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
          {!debounced && (
            <div className="pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground mb-3">
                Try
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuery(p)}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/20"
                  >
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Try
                      </p>
                      <p className="font-bold truncate group-hover:text-primary transition-colors">
                        {p}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {empty && (
            <p className="text-center text-muted-foreground py-16">
              No matches for{" "}
              <span className="font-bold text-foreground">"{debounced}"</span>.
            </p>
          )}

          <div className="space-y-7 pt-2">
            {comicMatches.length > 0 && (
              <Section
                title="Comics"
                count={comicMatches.length}
                onSeeAll={() => goToFiltered("comics")}
              >
                {comicMatches.map((c) => (
                  <Result
                    key={c.id}
                    image={c.image}
                    title={c.title}
                    subtitle={`${c.series} · ${c.creators}`}
                    onClick={() => setOpenComic(c)}
                  />
                ))}
              </Section>
            )}
            {animeHits.length > 0 && (
              <Section
                title="Anime"
                count={animeHits.length}
                tone="orange"
                onSeeAll={() => goToFiltered("anime")}
              >
                {animeHits.map((a: AnimeDto) => (
                  <Result
                    key={a.malId}
                    image={a.imageUrl ?? a.largeImageUrl ?? ""}
                    title={a.title}
                    subtitle={a.year ? `Anime · ${a.year}` : "Anime"}
                    badge={a.score ? `★ ${a.score.toFixed(1)}` : undefined}
                    onClick={() => setOpenAnime(a)}
                  />
                ))}
              </Section>
            )}
            {heroHits.length > 0 && (
              <Section
                title="Characters"
                count={heroHits.length}
                onSeeAll={() => goToFiltered("characters")}
              >
                {heroHits.map((h: SuperheroDto) => (
                  <Result
                    key={h.id}
                    image={h.images.sm ?? h.images.md ?? ""}
                    title={h.name}
                    subtitle={superheroSubtitle(h)}
                    badge={h.publisher ?? undefined}
                    onClick={() => setOpenHero(h)}
                  />
                ))}
              </Section>
            )}
            {mangaHits.length > 0 && (
              <Section
                title="Manga"
                count={mangaHits.length}
                onSeeAll={() => goToFiltered("manga")}
              >
                {mangaHits.map((m: MangaDto) => (
                  <Result
                    key={m.malId}
                    image={m.imageUrl ?? ""}
                    title={m.title}
                    subtitle={
                      m.titleEnglish && m.titleEnglish !== m.title
                        ? m.titleEnglish
                        : m.authors.join(", ") || "Manga"
                    }
                    badge={m.score ? `★ ${m.score.toFixed(1)}` : undefined}
                    onClick={() => setOpenManga(m)}
                  />
                ))}
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* Modals — rendered above the overlay so a click opens detail in place. */}
      {openComic && (
        <ComicModal
          isOpen={true}
          onClose={() => setOpenComic(null)}
          comic={{
            id: openComic.id,
            title: openComic.title,
            image: openComic.image,
            creators: openComic.creators,
            description: openComic.description,
            series: openComic.series,
          }}
        />
      )}
      {openHero && <HeroModal hero={openHero} onClose={() => setOpenHero(null)} />}
      {openManga && <MangaModal manga={openManga} onClose={() => setOpenManga(null)} />}
      {openAnime && <AnimeModal anime={openAnime} onClose={() => setOpenAnime(null)} />}
    </div>
  );

  // Portal to the document body so the overlay is never clipped by an ancestor
  // that establishes a containing block (the sticky, backdrop-blurred header)
  // — that clipping was why the search appeared not to open.
  return createPortal(overlay, document.body);
};

const Section = ({
  title,
  count,
  onSeeAll,
  tone = "red",
  children,
}: {
  title: string;
  count: number;
  onSeeAll: () => void;
  tone?: "red" | "orange";
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3
        className={cn(
          "text-xs font-bold uppercase tracking-[0.3em]",
          tone === "orange" ? "text-orange-500" : "text-primary"
        )}
      >
        {title} <span className="text-muted-foreground ml-1">({count})</span>
      </h3>
      <button
        type="button"
        onClick={onSeeAll}
        className={cn(
          "text-xs font-semibold hover:underline inline-flex items-center gap-1",
          tone === "orange" ? "text-orange-500" : "text-primary"
        )}
      >
        See all
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
    <div className="grid gap-2">{children}</div>
  </div>
);

const Result = ({
  image,
  title,
  subtitle,
  badge,
  onClick,
}: {
  image: string;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group w-full flex items-center gap-4 rounded-lg border border-border bg-card p-3 text-left transition-all",
      "hover:border-primary/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
    )}
  >
    <div className="relative h-16 w-12 rounded-md overflow-hidden bg-muted shrink-0">
      {image && (
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold truncate group-hover:text-primary transition-colors">
        {title}
      </p>
      <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
    </div>
    {badge && (
      <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider border border-border rounded-full px-2 py-0.5 text-muted-foreground shrink-0">
        {badge}
      </span>
    )}
    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
  </button>
);

export default MasterSearch;
