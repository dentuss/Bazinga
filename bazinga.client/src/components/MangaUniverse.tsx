import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import MangaModal from "@/components/MangaModal";
import {
  fetchManga,
  fetchMangaGenres,
  searchManga,
  type MangaDto,
} from "@/lib/metadata";
import { cn } from "@/lib/utils";

interface MangaUniverseProps {
  /** "home" = 18-card preview with "See all" link, no pagination/chips. */
  mode?: "home" | "full";
  viewAllHref?: string;
}

const FULL_PAGE_SIZE = 18; // three rows × six cards on lg+
const HOME_LIMIT = 18; // three rows on the home preview

import MediaCard from "@/components/MediaCard";

const MangaCard = ({
  manga,
  onSelect,
}: {
  manga: MangaDto;
  onSelect: (m: MangaDto) => void;
}) => (
  <MediaCard
    image={manga.largeImageUrl ?? manga.imageUrl ?? "/placeholder.svg"}
    title={manga.title}
    subtitle={manga.authors.join(", ") || (manga.type ?? "Manga")}
    score={manga.score}
    onClick={() => onSelect(manga)}
  />
);

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

  // Deep-link: ?openManga=<id> pops the modal as if the card was clicked.
  const openMangaId = searchParams.get("openManga");
  useEffect(() => {
    if (!openMangaId || selected) return;
    void fetchManga(Number(openMangaId)).then((manga) => {
      if (manga) setSelected(manga);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMangaId]);

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
          <Link
            to={viewAllHref}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            SEE ALL
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
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
