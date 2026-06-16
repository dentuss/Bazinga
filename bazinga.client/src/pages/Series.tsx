import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import TVHeader from "@/components/TVHeader";
import ShowModal from "@/components/ShowModal";
import {
  fetchSuperheroShows,
  searchSuperheroShows,
  showSubtitle,
  type SuperheroShowDto,
} from "@/lib/metadata";

const ShowGridCard = ({
  show,
  onSelect,
}: {
  show: SuperheroShowDto;
  onSelect: (s: SuperheroShowDto) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(show)}
    className="group text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md"
  >
    <div className="relative rounded-md overflow-hidden bg-card shadow-md transition-transform duration-200 group-hover:scale-[1.04]" style={{ aspectRatio: "2 / 3" }}>
      {show.imageMedium || show.imageOriginal ? (
        <img
          src={show.imageMedium ?? show.imageOriginal!}
          alt={show.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-orange-500/30 grid place-items-center p-3 text-center text-lg font-black text-white/80">
          {show.name}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      {show.rating != null && (
        <span className="absolute top-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
          ★ {show.rating.toFixed(1)}
        </span>
      )}
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-sm font-bold text-white drop-shadow line-clamp-2">{show.name}</p>
        <p className="text-[10px] uppercase tracking-wider text-white/70 line-clamp-1">
          {showSubtitle(show)}
        </p>
      </div>
    </div>
  </button>
);

const Series = () => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<SuperheroShowDto | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const base = useQuery({
    queryKey: ["superhero-shows"],
    queryFn: fetchSuperheroShows,
    staleTime: 6 * 60 * 60 * 1000,
  });

  const search = useQuery({
    queryKey: ["superhero-shows-search", debounced],
    queryFn: () => searchSuperheroShows(debounced),
    enabled: debounced.length > 1,
    staleTime: 60 * 1000,
  });

  const searching = debounced.length > 1;
  const items = useMemo<SuperheroShowDto[]>(
    () => (searching ? search.data ?? [] : base.data ?? []),
    [searching, search.data, base.data]
  );
  const loading = searching ? search.isLoading : base.isLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TVHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 40%, hsl(25 95% 55% / 0.22), transparent 65%), radial-gradient(ellipse at 70% 70%, hsl(0 82% 55% / 0.18), transparent 70%)",
            }}
          />
          <div className="relative container mx-auto px-4 md:px-8 py-12 md:py-16 text-center">
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-orange-500">
              BazingaTV
            </p>
            <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">
              Series
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Live-action superhero series — sourced live from TVMaze.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="flex justify-end mb-6">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search series…"
                className="w-full h-10 rounded-md bg-card border border-border pl-9 pr-3 text-sm outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-16">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading series…
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">
              {searching ? `No series match "${debounced}".` : "No series available right now."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {items.map((s) => (
                <ShowGridCard key={s.id} show={s} onSelect={setSelected} />
              ))}
            </div>
          )}
        </section>
      </main>

      {selected && <ShowModal show={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default Series;
