import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, Search, Sparkles, X } from "lucide-react";
import {
  fetchSuperheroes,
  searchManga,
  superheroSubtitle,
  type MangaDto,
  type SuperheroDto,
} from "@/lib/metadata";
import { placeholderComics, type PlaceholderComic } from "@/data/placeholderComics";
import { cn } from "@/lib/utils";

interface MasterSearchProps {
  open: boolean;
  onClose: () => void;
}

const PROMPTS = ["Berserk", "Spider-Man", "Night Cipher"] as const;

const MasterSearch = ({ open, onClose }: MasterSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Reset state when closed; bind Escape while open.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
      .slice(0, 4);
  }, [debounced]);

  const heroes = useQuery({
    queryKey: ["master-search:characters", debounced],
    queryFn: () => fetchSuperheroes({ q: debounced, limit: 4 }),
    enabled: debounced.length > 1,
    staleTime: 60 * 1000,
  });

  const manga = useQuery({
    queryKey: ["master-search:manga", debounced],
    queryFn: () => searchManga({ q: debounced, limit: 4 }),
    enabled: debounced.length > 1,
    staleTime: 60 * 1000,
  });

  if (!open) return null;

  const totalLoading = heroes.isFetching || manga.isFetching;
  const heroHits = heroes.data?.data ?? [];
  const mangaHits = manga.data?.data ?? [];
  const hasAnyResult =
    debounced.length > 1 &&
    (comicMatches.length > 0 || heroHits.length > 0 || mangaHits.length > 0);
  const empty =
    debounced.length > 1 && !totalLoading && !hasAnyResult;

  const goToFiltered = (target: "comics" | "characters" | "manga") => {
    const q = encodeURIComponent(debounced);
    onClose();
    if (target === "comics") navigate(`/comics/all?search=${q}`);
    else if (target === "characters") navigate(`/characters?q=${q}`);
    else navigate(`/manga?q=${q}`);
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm flex items-start justify-center p-4 md:p-8 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Search Bazinga"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mt-[8vh] max-h-[80vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="relative border-b border-border">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search comics, characters, manga…"
            className="w-full h-14 bg-transparent pl-12 pr-24 text-base font-semibold outline-none placeholder:text-muted-foreground/70"
          />
          {totalLoading && (
            <Loader2 className="absolute right-14 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-10 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-muted grid place-items-center transition-colors"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted grid place-items-center transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!debounced ? (
            <div className="p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Try searching
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuery(p)}
                    className="group flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5"
                  >
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {p}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground pt-2 border-t border-border mt-3">
                Tip — open from anywhere with{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-bold text-foreground text-[10px]">
                  Ctrl K
                </kbd>{" "}
                or{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-bold text-foreground text-[10px]">
                  ⌘K
                </kbd>
                .
              </p>
            </div>
          ) : empty ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No matches for{" "}
              <span className="font-bold text-foreground">"{debounced}"</span>.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {comicMatches.length > 0 && (
                <Section title="Comics" onSeeAll={() => goToFiltered("comics")}>
                  {comicMatches.map((c) => (
                    <Result
                      key={c.id}
                      image={c.image}
                      title={c.title}
                      subtitle={`${c.series} · ${c.creators}`}
                      href={`/comics/all?search=${encodeURIComponent(c.title)}`}
                      onClose={onClose}
                    />
                  ))}
                </Section>
              )}
              {heroHits.length > 0 && (
                <Section title="Characters" onSeeAll={() => goToFiltered("characters")}>
                  {heroHits.map((h: SuperheroDto) => (
                    <Result
                      key={h.id}
                      image={h.images.sm ?? h.images.md ?? ""}
                      title={h.name}
                      subtitle={superheroSubtitle(h)}
                      badge={h.publisher ?? undefined}
                      href={`/characters?q=${encodeURIComponent(h.name)}`}
                      onClose={onClose}
                    />
                  ))}
                </Section>
              )}
              {mangaHits.length > 0 && (
                <Section title="Manga" onSeeAll={() => goToFiltered("manga")}>
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
                      href={`/manga?q=${encodeURIComponent(m.title)}`}
                      onClose={onClose}
                    />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll: () => void;
  children: React.ReactNode;
}) => (
  <div className="px-5 py-3">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
        {title}
      </h3>
      <button
        type="button"
        onClick={onSeeAll}
        className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
      >
        See all
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const Result = ({
  image,
  title,
  subtitle,
  badge,
  href,
  onClose,
}: {
  image: string;
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
  onClose: () => void;
}) => (
  <Link
    to={href}
    onClick={onClose}
    className={cn(
      "group flex items-center gap-3 rounded-md px-2 py-2 transition-all",
      "hover:bg-muted/60 hover:translate-x-0.5"
    )}
  >
    <div className="relative h-12 w-9 rounded-sm overflow-hidden bg-muted shrink-0">
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
      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
        {title}
      </p>
      <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
    </div>
    {badge && (
      <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider border border-border rounded-full px-2 py-0.5 text-muted-foreground shrink-0">
        {badge}
      </span>
    )}
    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
  </Link>
);

export default MasterSearch;
