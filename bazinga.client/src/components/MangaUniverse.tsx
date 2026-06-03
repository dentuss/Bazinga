import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchManga,
  fetchMangaGenres,
  mangaMetaLine,
  searchManga,
  type MangaDto,
} from "@/lib/metadata";
import { cn } from "@/lib/utils";

const FULL_PAGE_SIZE = 18; // three rows × six cards on lg+
const HOME_LIMIT = 18; // three rows on the home preview

const MangaCard = ({
  manga,
  onSelect,
}: {
  manga: MangaDto;
  onSelect: (m: MangaDto) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(manga)}
    className="group relative text-left outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
  >
    <div
      className="relative rounded-md overflow-hidden bg-card shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-primary/30 group-hover:ring-2 group-hover:ring-primary/50"
      style={{ aspectRatio: "2 / 3" }}
    >
      <img
        src={manga.largeImageUrl ?? manga.imageUrl ?? "/placeholder.svg"}
        alt={manga.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, hsl(0 82% 55% / 0.35), transparent 65%)",
        }}
      />
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-2">
          {manga.title}
        </p>
        <p className="text-[10px] text-white/70 uppercase tracking-wider truncate">
          {mangaMetaLine(manga)}
        </p>
      </div>
      {manga.score ? (
        <span className="absolute top-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
          ★ {manga.score.toFixed(1)}
        </span>
      ) : null}
    </div>
  </button>
);

const MangaModal = ({
  manga,
  onClose,
}: {
  manga: MangaDto;
  onClose: () => void;
}) => {
  const { data: detail } = useQuery({
    queryKey: ["manga-detail", manga.malId],
    queryFn: () => fetchManga(manga.malId),
    staleTime: 60 * 60 * 1000,
  });
  const full = detail ?? manga;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl overflow-hidden border border-primary/40 bg-card shadow-[0_0_60px_hsl(0_82%_55%/0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="relative bg-black">
            <img
              src={full.largeImageUrl ?? full.imageUrl ?? "/placeholder.svg"}
              alt={full.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{full.title}</h2>
              {full.titleEnglish && full.titleEnglish !== full.title && (
                <p className="text-sm text-muted-foreground">{full.titleEnglish}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {full.score ? (
                <span className="font-bold text-primary">★ {full.score.toFixed(2)}</span>
              ) : null}
              {full.rank ? <span className="text-muted-foreground">Rank #{full.rank}</span> : null}
              <span className="text-muted-foreground">{mangaMetaLine(full)}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {full.synopsis ?? "No synopsis yet."}
            </p>
            {full.authors.length > 0 && (
              <p className="text-xs">
                <span className="text-muted-foreground mr-1">Authors:</span>
                {full.authors.join(", ")}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {full.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                >
                  {g}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-[1.03]">
                <BookOpen className="h-4 w-4" /> Read Now
              </Button>
              <Button variant="outline">Add to wishlist</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Discovery data from{" "}
              <a
                href={`https://myanimelist.net/manga/${full.malId}`}
                className="underline hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                MyAnimeList
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MangaUniverseProps {
  /** "home" = 18-card preview with "See all" link, no pagination/chips. */
  mode?: "home" | "full";
  viewAllHref?: string;
}

const MangaUniverse = ({ mode = "full", viewAllHref }: MangaUniverseProps = {}) => {
  const [searchParams] = useSearchParams();
  const masterQuery = (searchParams.get("q") ?? "").trim();
  const [selected, setSelected] = useState<MangaDto | null>(null);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const isHome = mode === "home";

  useEffect(() => {
    setPage(1);
  }, [activeGenre, masterQuery]);

  const { data: genreData } = useQuery({
    queryKey: ["manga-genres"],
    queryFn: fetchMangaGenres,
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !isHome,
  });

  const list = useQuery({
    queryKey: ["manga-grid", isHome ? "home" : "full", activeGenre ?? "all", masterQuery || "", isHome ? 1 : page],
    queryFn: () =>
      searchManga({
        q: !isHome && masterQuery.length > 1 ? masterQuery : undefined,
        genre: !isHome ? activeGenre ?? undefined : undefined,
        orderBy: isHome || !masterQuery ? "score" : undefined,
        page: isHome ? 1 : page,
        limit: isHome ? HOME_LIMIT : FULL_PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const curatedGenres = useMemo(() => {
    if (!genreData) return [];
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
    // Dedupe by lowercase name — Jikan can return overlapping themes/genres.
    const byName = new Map<string, (typeof genreData)[number]>();
    for (const g of genreData) {
      const key = g.name.toLowerCase();
      if (!byName.has(key)) byName.set(key, g);
    }
    return [...byName.values()]
      .filter((g) => preferred.includes(g.name))
      .sort((a, b) => preferred.indexOf(a.name) - preferred.indexOf(b.name));
  }, [genreData]);

  const items = list.data?.data ?? [];
  const pagination = list.data?.pagination;

  return (
    <section id="manga" className="container mx-auto px-4 md:px-8 py-12 md:py-16">
      <div className={isHome ? "flex items-center justify-between mb-6" : "mb-6"}>
        <div>
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-primary">
            {isHome ? "Manga" : "Discover"}
          </p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight mt-2">
            {isHome ? "MANGA" : "Manga Universe"}
          </h2>
          {!isHome && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {masterQuery
                ? `Manga matching "${masterQuery}", sourced live from MyAnimeList.`
                : "Covers, scores, synopsis. Sourced live from MyAnimeList."}
            </p>
          )}
        </div>
        {isHome && viewAllHref && (
          <a
            href={viewAllHref}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            SEE ALL
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        )}
      </div>

      {!isHome && curatedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <GenreChip
            label="Top picks"
            active={activeGenre === null}
            onClick={() => setActiveGenre(null)}
          />
          {curatedGenres.map((g) => (
            <GenreChip
              key={g.malId}
              label={g.name}
              active={activeGenre === g.malId}
              onClick={() => setActiveGenre(activeGenre === g.malId ? null : g.malId)}
            />
          ))}
        </div>
      )}

      <div className="relative min-h-[640px]">
        {list.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-16">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading manga…
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">
            No manga match — try a different filter or search term.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {items.map((m) => (
              <MangaCard key={m.malId} manga={m} onSelect={setSelected} />
            ))}
          </div>
        )}

        {list.isFetching && !list.isLoading && (
          <div className="absolute top-0 right-0 text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Updating…
          </div>
        )}
      </div>

      {!isHome && pagination && pagination.lastVisiblePage > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <PagerButton
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            direction="prev"
          >
            Previous
          </PagerButton>
          <span className="text-sm text-muted-foreground">
            Page <strong className="text-foreground">{pagination.currentPage}</strong> of{" "}
            {pagination.lastVisiblePage}
          </span>
          <PagerButton
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            direction="next"
          >
            Next
          </PagerButton>
        </div>
      )}

      {selected && <MangaModal manga={selected} onClose={() => setSelected(null)} />}
    </section>
  );
};

const GenreChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "shrink-0 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all duration-200 hover:-translate-y-0.5",
      active
        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
        : "bg-transparent text-foreground/80 border-border hover:border-primary/60 hover:text-primary"
    )}
  >
    {label}
  </button>
);

const PagerButton = ({
  disabled,
  onClick,
  direction,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  direction: "prev" | "next";
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-semibold transition-all duration-200 hover:border-primary/60 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
  >
    {direction === "prev" && <ChevronLeft className="h-4 w-4" />}
    {children}
    {direction === "next" && <ChevronRight className="h-4 w-4" />}
  </button>
);

export default MangaUniverse;
