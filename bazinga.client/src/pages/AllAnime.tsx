import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import TVHeader from "@/components/TVHeader";
import AnimeModal from "@/components/AnimeModal";
import { fetchAnimeGenres, searchAnime, type AnimeDto } from "@/lib/metadata";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 18;

const PREFERRED_GENRES = [
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

const AnimeGridCard = ({
  anime,
  onSelect,
}: {
  anime: AnimeDto;
  onSelect: (a: AnimeDto) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(anime)}
    className="group text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md"
  >
    <div className="relative rounded-md overflow-hidden bg-card shadow-md transition-transform duration-200 group-hover:scale-[1.04]" style={{ aspectRatio: "2 / 3" }}>
      <img
        src={anime.largeImageUrl ?? anime.imageUrl ?? "/placeholder.svg"}
        alt={anime.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      {anime.score ? (
        <span className="absolute top-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
          ★ {anime.score.toFixed(1)}
        </span>
      ) : null}
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-sm font-bold text-white drop-shadow line-clamp-2">{anime.title}</p>
        <p className="text-[10px] uppercase tracking-wider text-white/70">
          {anime.year ?? anime.type ?? "Anime"}
        </p>
      </div>
    </div>
  </button>
);

const AllAnime = () => {
  const [searchParams] = useSearchParams();
  const urlQ = (searchParams.get("q") ?? "").trim();
  const [query, setQuery] = useState(urlQ);
  const [debounced, setDebounced] = useState(urlQ);
  const [genre, setGenre] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AnimeDto | null>(null);

  // Keep input in sync if the URL query changes (e.g. arriving from search).
  useEffect(() => {
    setQuery(urlQ);
    setDebounced(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debounced, genre]);

  const genresQuery = useQuery({
    queryKey: ["anime-genres"],
    queryFn: fetchAnimeGenres,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const list = useQuery({
    queryKey: ["all-anime", debounced, genre ?? "all", page],
    queryFn: () =>
      searchAnime({
        q: debounced.length > 1 ? debounced : undefined,
        genre: genre ?? undefined,
        orderBy: debounced.length > 1 ? undefined : "score",
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const curatedGenres = useMemo(() => {
    const data = genresQuery.data ?? [];
    const byName = new Map<string, (typeof data)[number]>();
    for (const g of data) if (!byName.has(g.name)) byName.set(g.name, g);
    return [...byName.values()]
      .filter((g) => PREFERRED_GENRES.includes(g.name))
      .sort((a, b) => PREFERRED_GENRES.indexOf(a.name) - PREFERRED_GENRES.indexOf(b.name));
  }, [genresQuery.data]);

  const items = list.data?.data ?? [];
  const pagination = list.data?.pagination;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TVHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 70% 30%, hsl(25 95% 55% / 0.22), transparent 65%), radial-gradient(ellipse at 30% 70%, hsl(0 82% 55% / 0.18), transparent 70%)",
            }}
          />
          <div className="relative container mx-auto px-4 md:px-8 py-12 md:py-16 text-center">
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-orange-500">
              BazingaTV
            </p>
            <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">
              All Anime
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Every anime in the catalogue — sourced live from MyAnimeList.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex flex-wrap gap-2">
              <GenreChip label="Top picks" active={genre === null} onClick={() => setGenre(null)} />
              {curatedGenres.map((g) => (
                <GenreChip
                  key={g.malId}
                  label={g.name}
                  active={genre === g.malId}
                  onClick={() => setGenre(genre === g.malId ? null : g.malId)}
                />
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anime…"
                className="w-full h-10 rounded-md bg-card border border-border pl-9 pr-3 text-sm outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="relative min-h-[480px]">
            {list.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-16">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading anime…
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">
                No anime match — try a different filter or search.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {items.map((a) => (
                  <AnimeGridCard key={a.malId} anime={a} onSelect={setSelected} />
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

          {pagination && pagination.lastVisiblePage > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <PagerButton disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} direction="prev">
                Previous
              </PagerButton>
              <span className="text-sm text-muted-foreground">
                Page <strong className="text-foreground">{pagination.currentPage}</strong> of{" "}
                {pagination.lastVisiblePage}
              </span>
              <PagerButton disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)} direction="next">
                Next
              </PagerButton>
            </div>
          )}
        </section>
      </main>

      {selected && <AnimeModal anime={selected} onClose={() => setSelected(null)} />}
    </div>
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
      "shrink-0 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors",
      active
        ? "bg-orange-500 text-black border-orange-500"
        : "bg-transparent text-foreground/80 border-border hover:border-orange-500/60 hover:text-orange-400"
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
    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-semibold transition-all duration-200 hover:border-orange-500/60 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
  >
    {direction === "prev" && <ChevronLeft className="h-4 w-4" />}
    {children}
    {direction === "next" && <ChevronRight className="h-4 w-4" />}
  </button>
);

export default AllAnime;
