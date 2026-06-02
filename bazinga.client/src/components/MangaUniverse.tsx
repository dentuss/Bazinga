import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchMangaGenres,
  fetchTopManga,
  fetchManga,
  searchManga,
  mangaMetaLine,
  type MangaDto,
} from "@/lib/metadata";

const railId = "manga-universe-rail";

const scrollRail = (dir: -1 | 1) => () => {
  const el = document.getElementById(railId);
  if (!el) return;
  el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
};

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
    className="group shrink-0 w-40 md:w-52 snap-start text-left outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
  >
    <div className="relative rounded-md overflow-hidden bg-card shadow-lg group-hover:shadow-2xl group-hover:shadow-primary/30 transition-shadow" style={{ aspectRatio: "2 / 3" }}>
      <img
        src={manga.largeImageUrl ?? manga.imageUrl ?? "/placeholder.svg"}
        alt={manga.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
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
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl rounded-xl overflow-hidden border border-primary/40 bg-card shadow-[0_0_60px_hsl(0_82%_55%/0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="relative">
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
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <BookOpen className="h-4 w-4" /> Read sample
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

const MangaUniverse = () => {
  const [selected, setSelected] = useState<MangaDto | null>(null);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  // Debounce typing for the search input.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const top = useQuery({
    queryKey: ["manga-top"],
    queryFn: () => fetchTopManga(1, 14),
    staleTime: 15 * 60 * 1000,
  });
  const genres = useQuery({
    queryKey: ["manga-genres"],
    queryFn: fetchMangaGenres,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const filtered = useQuery({
    queryKey: ["manga-filtered", debounced, activeGenre ?? "all"],
    queryFn: () =>
      searchManga({
        q: debounced.length > 1 ? debounced : undefined,
        genre: activeGenre ?? undefined,
        orderBy: debounced ? undefined : "score",
        limit: 18,
      }),
    enabled: debounced.length > 1 || activeGenre !== null,
    staleTime: 5 * 60 * 1000,
  });

  const showFiltered = debounced.length > 1 || activeGenre !== null;
  const list = (showFiltered ? filtered.data?.data : top.data?.data) ?? [];
  const loading = showFiltered ? filtered.isFetching : top.isLoading;

  const curatedGenres = useMemo(() => {
    if (!genres.data) return [];
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
    return genres.data
      .filter((g) => preferred.includes(g.name))
      .sort((a, b) => preferred.indexOf(a.name) - preferred.indexOf(b.name));
  }, [genres.data]);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Discover
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1">
            Manga Universe
          </h2>
          <p className="text-sm text-muted-foreground">
            Pull metadata for any series — covers, scores, synopsis. Sourced live from MyAnimeList.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search titles — 'berserk', 'monster'…"
            className="pl-9"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {curatedGenres.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-3" style={{ scrollbarWidth: "none" }}>
          <button
            type="button"
            onClick={() => setActiveGenre(null)}
            className={`shrink-0 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
              activeGenre === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-foreground/80 border-border hover:border-foreground/60"
            }`}
          >
            Top picks
          </button>
          {curatedGenres.map((g) => (
            <button
              key={g.malId}
              type="button"
              onClick={() => setActiveGenre(activeGenre === g.malId ? null : g.malId)}
              className={`shrink-0 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                activeGenre === g.malId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-foreground/80 border-border hover:border-foreground/60"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative group/row mt-2">
        <button
          type="button"
          onClick={scrollRail(-1)}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-r from-background via-background/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        <button
          type="button"
          onClick={scrollRail(1)}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-l from-background via-background/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
        <div
          id={railId}
          className="flex gap-3 md:gap-4 overflow-x-auto pb-6 pt-4 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 px-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading manga…
            </div>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 px-2">
              No matches — try a different filter or search term.
            </p>
          ) : (
            list.map((m) => <MangaCard key={m.malId} manga={m} onSelect={setSelected} />)
          )}
        </div>
      </div>

      {selected && <MangaModal manga={selected} onClose={() => setSelected(null)} />}
    </section>
  );
};

export default MangaUniverse;
