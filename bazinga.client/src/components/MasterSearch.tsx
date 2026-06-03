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

const MasterSearch = ({ open, onClose }: MasterSearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

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
      .slice(0, 6);
  }, [debounced]);

  const heroes = useQuery({
    queryKey: ["master-search:characters", debounced],
    queryFn: () => fetchSuperheroes({ q: debounced, limit: 8 }),
    enabled: debounced.length > 1,
    staleTime: 60 * 1000,
  });

  const manga = useQuery({
    queryKey: ["master-search:manga", debounced],
    queryFn: () => searchManga({ q: debounced, limit: 8 }),
    enabled: debounced.length > 1,
    staleTime: 60 * 1000,
  });

  if (!open) return null;

  const totalLoading = heroes.isFetching || manga.isFetching;
  const heroHits = heroes.data?.data ?? [];
  const mangaHits = manga.data?.data ?? [];
  const empty =
    debounced.length > 1 &&
    !totalLoading &&
    comicMatches.length === 0 &&
    heroHits.length === 0 &&
    mangaHits.length === 0;

  const goToFiltered = (target: "comics" | "characters" | "manga") => {
    const q = encodeURIComponent(debounced);
    onClose();
    if (target === "comics") navigate(`/comics?search=${q}`);
    else if (target === "characters") navigate(`/characters?q=${q}`);
    else navigate(`/comics?q=${q}#manga`);
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Search Bazinga"
      onClick={onClose}
    >
      <div
        className="container mx-auto max-w-3xl px-4 md:px-8 pt-6 md:pt-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-primary">
            Search Bazinga
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-card/80 hover:bg-card flex items-center justify-center transition-colors"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search comics, characters, manga…"
            className="w-full h-14 md:h-16 rounded-lg bg-card border-2 border-border pl-12 pr-14 text-base md:text-lg font-semibold outline-none focus:border-primary focus:shadow-[0_0_30px_hsl(0_82%_55%/0.25)] transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground flex items-center gap-3">
          <span>Tip — press <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-bold text-foreground">Esc</kbd> to close.</span>
          {totalLoading && (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching…
            </span>
          )}
        </p>
      </div>

      <div
        className="flex-1 overflow-y-auto pt-4 pb-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="container mx-auto max-w-3xl px-4 md:px-8 space-y-8">
          {!debounced && <PromptHints />}

          {empty && (
            <p className="text-center text-muted-foreground py-12">
              No matches for <span className="font-bold text-foreground">"{debounced}"</span>.
              Try a series, character, or creator name.
            </p>
          )}

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
                  subtitle={c.series + " · " + c.creators}
                  href={`/comics?search=${encodeURIComponent(c.title)}`}
                  onClose={onClose}
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
                  href={`/characters?q=${encodeURIComponent(h.name)}`}
                  onClose={onClose}
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
                      : (m.authors.join(", ") || "Manga")
                  }
                  badge={m.score ? `★ ${m.score.toFixed(1)}` : undefined}
                  href={`/comics?q=${encodeURIComponent(m.title)}#manga`}
                  onClose={onClose}
                />
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

const PromptHints = () => (
  <div className="grid gap-3 sm:grid-cols-3 pt-2">
    {[
      { label: "Berserk", target: "manga" },
      { label: "Spider-Man", target: "characters" },
      { label: "Night Cipher", target: "comics" },
    ].map((s) => (
      <button
        key={s.label}
        type="button"
        onClick={() => {
          const input = document.querySelector<HTMLInputElement>(
            'input[placeholder="Search comics, characters, manga…"]'
          );
          if (input) {
            input.value = s.label;
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }}
        className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20"
      >
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Try
          </p>
          <p className="font-bold truncate group-hover:text-primary transition-colors">
            {s.label}
          </p>
        </div>
      </button>
    ))}
  </div>
);

const Section = ({
  title,
  count,
  onSeeAll,
  children,
}: {
  title: string;
  count: number;
  onSeeAll: () => void;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
        {title} <span className="text-muted-foreground ml-1">({count})</span>
      </h3>
      <button
        type="button"
        onClick={onSeeAll}
        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
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
      "group flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-all",
      "hover:border-primary/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
    )}
  >
    <div className="relative h-16 w-12 rounded-md overflow-hidden bg-muted shrink-0">
      {image ? (
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
      ) : null}
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
    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
  </Link>
);

export default MasterSearch;
