import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import MangaModal from "@/components/MangaModal";
import MediaCard from "@/components/MediaCard";
import Rail from "@/components/Rail";
import {
  fetchManga,
  fetchMangaGenres,
  searchManga,
  type MangaDto,
} from "@/lib/metadata";
import { cn } from "@/lib/utils";

interface MangaUniverseProps {
  mode?: "home" | "full";
  viewAllHref?: string;
}

const FULL_PAGE_SIZE = 18;
const HOME_LIMIT = 20;

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
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const masterQuery = (searchParams.get("q") ?? "").trim();
  const [selected, setSelected] = useState<MangaDto | null>(null);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const isHome = mode === "home";

  // Local search input — mirrors AllComics so each catalog has its own
  // page-level search box. It stays in sync with the ?q URL param so global
  // search → catalogue still works.
  const [localQuery, setLocalQuery] = useState(masterQuery);
  const [debounced, setDebounced] = useState(masterQuery);
  useEffect(() => {
    setLocalQuery(masterQuery);
    setDebounced(masterQuery);
  }, [masterQuery]);
  useEffect(() => {
    if (isHome) return;
    const id = setTimeout(() => {
      const trimmed = localQuery.trim();
      setDebounced(trimmed);
      const next = new URLSearchParams(searchParams);
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQuery, isHome]);

  useEffect(() => {
    setPage(1);
  }, [activeGenre, debounced]);

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
    queryKey: [
      "manga-grid",
      isHome ? "home" : "full",
      activeGenre ?? "all",
      debounced || "",
      isHome ? 1 : page,
    ],
    queryFn: () =>
      searchManga({
        q: !isHome && debounced.length > 1 ? debounced : undefined,
        genre: !isHome ? activeGenre ?? undefined : undefined,
        orderBy: isHome || !debounced ? "score" : undefined,
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

  if (isHome) {
    return (
      <>
        <Rail
          id="manga-rail"
          title={t("manga.mangaUniverse").toUpperCase()}
          viewAllHref={viewAllHref}
          rows={2}
          loading={list.isLoading}
          empty={items.length === 0}
          emptyMessage={t("manga.noneFound")}
        >
          {items.map((m) => (
            <MediaCard
              key={m.malId}
              image={m.largeImageUrl ?? m.imageUrl ?? "/placeholder.svg"}
              title={m.title}
              subtitle={m.authors.join(", ") || m.type || "Manga"}
              score={m.score}
              width="rail"
              onClick={() => setSelected(m)}
            />
          ))}
        </Rail>
        {selected && <MangaModal manga={selected} onClose={() => setSelected(null)} />}
      </>
    );
  }

  return (
    <section id="manga" className="container mx-auto px-4 md:px-8 py-12 md:py-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-primary">
            {t("manga.discover")}
          </p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight mt-2">
            {t("manga.mangaUniverse")}
          </h2>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={t("manga.searchPlaceholder")}
            className="w-full h-10 rounded-md bg-card border border-border pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {curatedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <GenreChip
            label={t("manga.topPicks")}
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
            {t("manga.loading")}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">
            {t("manga.noneFound")}
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
            {t("manga.updating")}
          </div>
        )}
      </div>

      {pagination && pagination.lastVisiblePage > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <PagerButton
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            direction="prev"
          >
            {t("comics.previous")}
          </PagerButton>
          <span className="text-sm text-muted-foreground">
            {t("comics.page")}{" "}
            <strong className="text-foreground">{pagination.currentPage}</strong>{" "}
            {t("comics.of")} {pagination.lastVisiblePage}
          </span>
          <PagerButton
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            direction="next"
          >
            {t("comics.next")}
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
