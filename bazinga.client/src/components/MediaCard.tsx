import { BookOpen } from "lucide-react";
import { resolveImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  image: string;
  title: string;
  /** Sub-line under the title (creators / authors / metaline). */
  subtitle?: string;
  /** Optional score badge shown top-right (e.g. for manga ratings). */
  score?: number | null;
  onClick?: () => void;
  /**
   * Width preset:
   *  - "auto" (default) — lets the parent grid size it
   *  - "rail" — fixed Netflix-style tile that flexes nicely inside a rail
   */
  width?: "auto" | "rail";
}

const widthClass = {
  auto: "",
  rail: "shrink-0 w-40 md:w-48 snap-start",
} as const;

/**
 * Unified card for any media tile across the Comics shelf — used by both
 * comics and manga so they look identical.
 *  - title sits BELOW the cover
 *  - cover lifts + scales on hover
 *  - red radial bloom + "READ" chip slide in on hover
 *  - optional score chip in the top-right corner (manga)
 *  - gradient fallback shows through when the image fails to load
 */
const MediaCard = ({
  image,
  title,
  subtitle,
  score,
  onClick,
  width = "auto",
}: MediaCardProps) => {
  // Deterministic "seed" so each title gets a consistent fallback gradient
  // instead of all-broken-cards-look-the-same.
  const seed = (title.charCodeAt(0) ?? 0) % 4;
  const fallbackBg = [
    "from-primary/40 via-primary/15 to-orange-500/30",
    "from-orange-500/35 via-primary/20 to-primary/30",
    "from-primary/35 via-purple-500/15 to-primary/40",
    "from-orange-500/40 via-primary/25 to-orange-500/25",
  ][seed];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-md bg-card text-left transition-all duration-300 ease-out cursor-pointer outline-none",
        "hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/30 hover:ring-2 hover:ring-primary/50",
        "focus-visible:ring-2 focus-visible:ring-primary",
        widthClass[width]
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {/* Fallback gradient sits behind the image so failed loads still look intentional */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            fallbackBg,
          )}
        />
        <div aria-hidden className="absolute inset-0 grid place-items-center text-center px-3">
          <span className="text-xs font-black uppercase tracking-wider text-white/85 line-clamp-3 drop-shadow">
            {title}
          </span>
        </div>
        <img
          src={resolveImageUrl(image)}
          alt={title}
          loading="lazy"
          className="relative h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, hsl(0 82% 55% / 0.45), transparent 65%)",
          }}
        />
        {score != null && (
          <span className="absolute top-2 right-2 rounded-md bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-white">
            ★ {score.toFixed(1)}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 p-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg">
            <BookOpen className="h-3 w-3" />
            Read
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
        )}
      </div>
    </button>
  );
};

export default MediaCard;
