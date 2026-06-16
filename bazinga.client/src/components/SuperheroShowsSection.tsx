import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Play, Plus } from "lucide-react";
import ShowModal from "@/components/ShowModal";
import {
  fetchSuperheroShows,
  showMetaLine,
  showSubtitle,
  type SuperheroShowDto,
} from "@/lib/metadata";

const RAIL_ID = "superhero-shows-rail";

const scrollRail = (dir: -1 | 1) => () => {
  const el = document.getElementById(RAIL_ID);
  if (!el) return;
  el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
};

const SuperheroShowsSection = () => {
  const [selected, setSelected] = useState<SuperheroShowDto | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["superhero-shows"],
    queryFn: fetchSuperheroShows,
    staleTime: 6 * 60 * 60 * 1000,
  });

  return (
    <section className="relative py-4 md:py-6" id="superhero-shows">
      <div className="container mx-auto px-4 md:px-8 mb-3 flex items-center justify-between">
        <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3">
          <span className="grid place-items-center h-7 px-2 rounded-sm bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider">
            Heroes
          </span>
          Superhero Shows
        </h3>
        <Link
          to="/bazinga-tv/series"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
        >
          Explore all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="relative group/row">
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
          id={RAIL_ID}
          className="grid grid-rows-2 grid-flow-col auto-cols-max gap-x-3 gap-y-4 md:gap-x-4 overflow-x-auto px-4 md:px-8 pb-10 pt-10 scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading superhero shows…
            </div>
          ) : data.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">
              No superhero shows available right now.
            </p>
          ) : (
            data.map((show) => <ShowCard key={show.id} show={show} onSelect={setSelected} />)
          )}
        </div>
      </div>
      {selected && <ShowModal show={selected} onClose={() => setSelected(null)} />}
    </section>
  );
};

const ShowCard = ({
  show,
  onSelect,
}: {
  show: SuperheroShowDto;
  onSelect: (s: SuperheroShowDto) => void;
}) => (
  <div className="relative shrink-0 w-40 md:w-52 snap-start" style={{ aspectRatio: "2 / 3" }}>
    <button
      type="button"
      onClick={() => onSelect(show)}
      className="group/card absolute inset-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md transition-all duration-300 ease-out hover:scale-[1.15] hover:z-30 origin-center"
    >
      <div className="relative h-full rounded-md overflow-hidden bg-card shadow-lg group-hover/card:shadow-2xl group-hover/card:shadow-orange-500/30 ring-0 group-hover/card:ring-2 group-hover/card:ring-orange-500/60 transition-shadow">
        {show.imageMedium || show.imageOriginal ? (
          <img
            src={show.imageMedium ?? show.imageOriginal!}
            alt={show.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-orange-500/30 grid place-items-center text-2xl font-black text-white/80 p-3 text-center">
            {show.name}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 transition-opacity duration-200 group-hover/card:opacity-0">
          <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-2">
            {show.name}
          </p>
          <p className="text-[10px] md:text-xs text-white/70 uppercase tracking-wider">
            {showSubtitle(show)}
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300 bg-gradient-to-t from-black via-black/90 to-transparent">
          <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-2 mb-2">
            {show.name}
          </p>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="grid place-items-center h-7 w-7 rounded-full bg-white text-black">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            <span className="grid place-items-center h-7 w-7 rounded-full border border-white/40 text-white">
              <Plus className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="text-[10px] md:text-xs text-white/80 line-clamp-1">
            {showMetaLine(show) || show.genres.slice(0, 3).join(" · ")}
          </p>
        </div>
      </div>
    </button>
  </div>
);

export default SuperheroShowsSection;
