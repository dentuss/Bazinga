import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  fetchSuperhero,
  fetchSuperheroes,
  fetchSuperheroPublishers,
  superheroSubtitle,
  type SuperheroDto,
} from "@/lib/metadata";
import HeroModal from "@/components/HeroModal";
import { cn } from "@/lib/utils";

const PUBLISHER_PRESETS = ["Marvel Comics", "DC Comics", "Dark Horse Comics", "Image Comics"];

const SuperheroesSection = () => {
  const [searchParams] = useSearchParams();
  const masterQuery = (searchParams.get("q") ?? "").trim();
  const [publisher, setPublisher] = useState<string | null>("Marvel Comics");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SuperheroDto | null>(null);

  useEffect(() => {
    setPage(1);
  }, [publisher, masterQuery]);

  const publishersQuery = useQuery({
    queryKey: ["superhero-publishers"],
    queryFn: fetchSuperheroPublishers,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Deep-link: ?openHero=<id> opens the modal as if the card was clicked.
  // Used by the master search to pop a result without needing to scroll the
  // grid to find it.
  const openHeroId = searchParams.get("openHero");
  useEffect(() => {
    if (!openHeroId || selected) return;
    void fetchSuperhero(Number(openHeroId)).then((hero) => {
      if (hero) setSelected(hero);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openHeroId]);

  const heroesQuery = useQuery({
    queryKey: ["superheroes", publisher ?? "all", masterQuery, page],
    queryFn: () =>
      fetchSuperheroes({
        publisher: publisher ?? undefined,
        q: masterQuery || undefined,
        page,
        limit: 18,
      }),
    placeholderData: keepPreviousData,
    staleTime: 12 * 60 * 60 * 1000,
  });

  const heroes = heroesQuery.data?.data ?? [];
  const pagination = heroesQuery.data?.pagination;

  const publisherChips = useMemo(() => {
    const fromApi = publishersQuery.data ?? [];
    const presets = PUBLISHER_PRESETS.filter((p) => fromApi.includes(p));
    const rest = fromApi.filter((p) => !presets.includes(p));
    return [...presets, ...rest];
  }, [publishersQuery.data]);

  return (
    <section id="superheroes" className="container mx-auto px-4 md:px-8 py-12 md:py-16">
      <div className="mb-6">
        <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-primary">
          Superhero Universe
        </p>
        <h2 className="mt-2 text-2xl md:text-4xl font-black tracking-tight">
          Heroes &amp; Villains
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          {masterQuery
            ? `Showing characters matching "${masterQuery}".`
            : `Browse ${pagination?.totalItems ?? "thousands of"} characters from every comic multiverse — Marvel, DC, Dark Horse and more.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <PublisherChip
          label="All publishers"
          active={publisher === null}
          onClick={() => setPublisher(null)}
        />
        {publisherChips.map((p) => (
          <PublisherChip
            key={p}
            label={p}
            active={publisher === p}
            onClick={() => setPublisher(p)}
          />
        ))}
      </div>

      <div className="relative min-h-[280px]">
        {heroesQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-12">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading characters…
          </div>
        ) : heroes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No characters match — try a different publisher or name.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {heroes.map((hero) => (
              <HeroCard key={hero.id} hero={hero} onSelect={setSelected} />
            ))}
          </div>
        )}

        {heroesQuery.isFetching && !heroesQuery.isLoading && (
          <div className="absolute top-0 right-0 text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Updating…
          </div>
        )}
      </div>

      {pagination && pagination.lastVisiblePage > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-semibold hover:border-primary/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page <strong className="text-foreground">{pagination.currentPage}</strong> of{" "}
            {pagination.lastVisiblePage}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-semibold hover:border-primary/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {selected && <HeroModal hero={selected} onClose={() => setSelected(null)} />}
    </section>
  );
};

const PublisherChip = ({
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
      "px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border text-muted-foreground hover:border-foreground/60 hover:text-foreground"
    )}
  >
    {label}
  </button>
);

const HeroCard = ({
  hero,
  onSelect,
}: {
  hero: SuperheroDto;
  onSelect: (h: SuperheroDto) => void;
}) => {
  const accent =
    hero.alignment === "bad"
      ? "ring-red-500/60 group-hover:ring-red-500"
      : hero.alignment === "neutral"
        ? "ring-yellow-400/60 group-hover:ring-yellow-400"
        : "ring-primary/40 group-hover:ring-primary";
  return (
    <button
      type="button"
      onClick={() => onSelect(hero)}
      className="group relative text-left outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
    >
      <div
        className={cn(
          "relative aspect-[3/4] rounded-lg overflow-hidden bg-card shadow-md ring-1 transition-all duration-200 group-hover:scale-[1.04]",
          accent
        )}
      >
        {hero.images.md || hero.images.sm ? (
          <img
            src={hero.images.md ?? hero.images.sm!}
            alt={hero.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        {hero.alignment && (
          <span
            className={cn(
              "absolute top-2 left-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
              hero.alignment === "bad"
                ? "bg-red-500 text-white"
                : hero.alignment === "neutral"
                  ? "bg-yellow-400 text-black"
                  : "bg-primary text-primary-foreground"
            )}
          >
            {hero.alignment}
          </span>
        )}
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-sm font-black text-white drop-shadow line-clamp-1">{hero.name}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/70 line-clamp-1">
            {superheroSubtitle(hero)}
          </p>
        </div>
      </div>
    </button>
  );
};


export default SuperheroesSection;
