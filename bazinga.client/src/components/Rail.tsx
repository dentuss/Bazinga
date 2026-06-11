import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface RailProps {
  /** Stable id used as the rail's scroll container. */
  id: string;
  /** Big row title shown on the left. */
  title: React.ReactNode;
  /** Optional "SEE ALL" link rendered top-right. */
  viewAllHref?: string;
  /** Tone of the "SEE ALL" link. */
  viewAllTone?: "red" | "orange";
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

const trackId = (id: string) => `${id}-track`;

const scrollRail = (id: string, dir: -1 | 1) => () => {
  const el = document.getElementById(trackId(id));
  if (!el) return;
  el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
};

/**
 * Netflix-style horizontal rail: a single row that scrolls via on-edge arrow
 * buttons. The native scrollbar is hidden so the rail visually anchors at the
 * row height — no extra bottom scroll bleeds into the page.
 */
const Rail = ({
  id,
  title,
  viewAllHref,
  viewAllTone = "red",
  loading,
  empty,
  emptyMessage = "Nothing here yet.",
  children,
}: RailProps) => {
  const toneClass =
    viewAllTone === "orange"
      ? "text-orange-500 hover:text-orange-400"
      : "text-primary hover:text-primary/80";
  return (
    <section id={id} className="py-8 md:py-10">
      <div className="container mx-auto px-4 md:px-8 mb-4 flex items-end justify-between gap-3">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className={`flex items-center gap-1 text-xs md:text-sm font-bold uppercase tracking-widest transition-colors ${toneClass}`}
          >
            See all
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
      <div className="relative group/row">
        <button
          type="button"
          onClick={scrollRail(id, -1)}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-r from-background via-background/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        <button
          type="button"
          onClick={scrollRail(id, 1)}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 w-12 items-center justify-center bg-gradient-to-l from-background via-background/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
        <div
          id={trackId(id)}
          className="flex gap-4 md:gap-5 overflow-x-auto px-4 md:px-8 pb-2 pt-6 scroll-smooth snap-x snap-mandatory no-scrollbar"
          style={{ scrollbarWidth: "none" }}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 px-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : empty ? (
            <p className="text-sm text-muted-foreground py-8 px-2">{emptyMessage}</p>
          ) : (
            children
          )}
        </div>
      </div>
    </section>
  );
};


export default Rail;
