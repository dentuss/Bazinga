import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Search,
  Shield,
  Sparkles,
  Sword,
  X,
  Zap,
} from "lucide-react";
import {
  fetchSuperheroes,
  fetchSuperheroPublishers,
  superheroSubtitle,
  type SuperheroDto,
} from "@/lib/metadata";
import { cn } from "@/lib/utils";

const PUBLISHER_PRESETS = ["Marvel Comics", "DC Comics", "Dark Horse Comics", "Image Comics"];

const SuperheroesSection = () => {
  const [publisher, setPublisher] = useState<string | null>("Marvel Comics");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SuperheroDto | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [publisher, debouncedQuery]);

  const publishersQuery = useQuery({
    queryKey: ["superhero-publishers"],
    queryFn: fetchSuperheroPublishers,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const heroesQuery = useQuery({
    queryKey: ["superheroes", publisher ?? "all", debouncedQuery, page],
    queryFn: () =>
      fetchSuperheroes({
        publisher: publisher ?? undefined,
        q: debouncedQuery || undefined,
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
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-primary">
            Superhero Universe
          </p>
          <h2 className="mt-2 text-2xl md:text-4xl font-black tracking-tight">
            Heroes &amp; Villains
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Browse {pagination?.totalItems ?? "thousands of"} characters from every comic
            multiverse — Marvel, DC, Dark Horse and more.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 h-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors"
          />
        </div>
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

const STAT_ICONS = {
  intelligence: Sparkles,
  strength: Sword,
  speed: Zap,
  durability: Shield,
  power: Sparkles,
  combat: Sword,
} as const;

const HeroModal = ({
  hero,
  onClose,
}: {
  hero: SuperheroDto;
  onClose: () => void;
}) => {
  const stats: Array<[keyof typeof STAT_ICONS, number]> = [
    ["intelligence", hero.powerstats.intelligence],
    ["strength", hero.powerstats.strength],
    ["speed", hero.powerstats.speed],
    ["durability", hero.powerstats.durability],
    ["power", hero.powerstats.power],
    ["combat", hero.powerstats.combat],
  ];
  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl overflow-hidden border border-primary/40 bg-card shadow-[0_0_60px_hsl(0_82%_55%/0.3)]"
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
        <div className="grid md:grid-cols-[260px_1fr]">
          <div className="relative bg-black h-64 md:h-auto">
            {hero.images.lg || hero.images.md ? (
              <img
                src={hero.images.lg ?? hero.images.md!}
                alt={hero.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-5xl font-black text-white/30">
                {hero.name.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <h2 className="text-3xl font-black tracking-tight">{hero.name}</h2>
              {hero.fullName && (
                <p className="text-sm text-muted-foreground mt-1">{hero.fullName}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                {hero.publisher && (
                  <span className="border border-primary/40 text-primary rounded-full px-2 py-0.5">
                    {hero.publisher}
                  </span>
                )}
                {hero.alignment && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5",
                      hero.alignment === "bad"
                        ? "bg-red-500/15 text-red-400 border border-red-500/40"
                        : hero.alignment === "neutral"
                          ? "bg-yellow-400/15 text-yellow-400 border border-yellow-400/40"
                          : "bg-green-500/15 text-green-400 border border-green-500/40"
                    )}
                  >
                    {hero.alignment}
                  </span>
                )}
                {hero.race && (
                  <span className="border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                    {hero.race}
                  </span>
                )}
              </div>
            </div>

            {hero.aliases.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Aliases: </span>
                <span className="text-foreground/85">{hero.aliases.join(" · ")}</span>
              </div>
            )}

            <div className="grid gap-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Powerstats
              </p>
              {stats.map(([key, value]) => {
                const Icon = STAT_ICONS[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs uppercase tracking-wider text-muted-foreground w-24 shrink-0">
                      {key}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-orange-500"
                        style={{ width: `${Math.max(2, value)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-8 text-right">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>

            {hero.occupation && (
              <Detail label="Occupation" value={hero.occupation} />
            )}
            {hero.groupAffiliation && (
              <Detail label="Affiliations" value={hero.groupAffiliation} icon={<Heart className="h-3.5 w-3.5" />} />
            )}
            {hero.placeOfBirth && (
              <Detail label="Place of birth" value={hero.placeOfBirth} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Detail = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) => (
  <div className="text-sm">
    <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
      {icon}
      {label}
    </p>
    <p className="text-foreground/85 mt-0.5 leading-relaxed">{value}</p>
  </div>
);

export default SuperheroesSection;
