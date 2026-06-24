import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Play, Plus, Sparkles } from "lucide-react";
import type { MediaItem } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/contexts/CollectionsContext";
import { hasTVAccess } from "@/lib/access";
import { cn } from "@/lib/utils";

/**
 * Rail tile for a DB-backed MediaItem. Visually mirrors the Jikan AnimeCard
 * (same 2:3 poster, hover scale, Play / + chips) so DB items can sit at the
 * head of the existing rails without looking pasted in. Click navigates
 * straight to the Watch page (DB items have full detail there); Play and +
 * stay on the card via stopPropagation, matching the Jikan AnimeCard.
 *
 * Comics-only users see the gradient Join Now chip instead of Play, per the
 * same rule the rest of the TV surface follows.
 */
interface MediaRailCardProps {
  item: MediaItem;
}

const MediaRailCard = ({ item }: MediaRailCardProps) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { isSaved, toggle } = useCollections();
  const { t } = useTranslation();
  const canWatch = hasTVAccess(user?.subscriptionType);

  // Collection id namespaced under the slug so it doesn't collide with Jikan
  // ids in the same mylist table.
  const contentId = `media-${item.slug}`;
  const saved = isSaved("mylist", "show", contentId);

  const open = () => navigate(`/bazinga-tv/watch/${item.slug}`);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!canWatch) {
      navigate("/bazinga-unlimited");
      return;
    }
    open();
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    void toggle("mylist", {
      kind: "show",
      contentId,
      title: item.title,
      image: item.posterImage ?? item.backdropImage ?? null,
      subtitle: item.tagline ?? undefined,
    });
  };

  const poster = item.posterImage ?? item.backdropImage ?? null;

  return (
    <div
      className="relative shrink-0 w-40 md:w-52 snap-start"
      style={{ aspectRatio: "2 / 3" }}
    >
      <button
        type="button"
        onClick={open}
        className="group/card absolute inset-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-md transition-all duration-300 ease-out hover:scale-[1.15] hover:z-30 origin-center"
      >
        <div className="relative h-full rounded-md overflow-hidden bg-card shadow-lg group-hover/card:shadow-2xl group-hover/card:shadow-orange-500/30 ring-0 group-hover/card:ring-2 group-hover/card:ring-orange-500/60 transition-shadow">
          {poster ? (
            <img
              src={poster}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/15 to-orange-500/30 grid place-items-center p-3 text-center text-lg font-black text-white/80">
              {item.title}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* "Originals" badge so the user knows this came from Bazinga,
             not Jikan/TVMaze. */}
          <span className="absolute top-2 left-2 bg-orange-500 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
            Originals
          </span>

          {/* Default footer */}
          <div className="absolute bottom-2 left-2 right-2 transition-opacity duration-200 group-hover/card:opacity-0">
            <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-2">
              {item.title}
            </p>
            <p className="text-[10px] md:text-xs text-white/70 uppercase tracking-wider">
              {item.year ?? ""}{item.year && item.rating ? " · " : ""}{item.rating ?? ""}
            </p>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300 bg-gradient-to-t from-black via-black/90 to-transparent">
            <p className="text-sm md:text-base font-bold text-white drop-shadow line-clamp-2 mb-2">
              {item.title}
            </p>
            <div className="flex items-center gap-1.5 mb-2">
              {user && !canWatch ? (
                <button
                  type="button"
                  onClick={handlePlay}
                  aria-label={t("header.joinNow")}
                  className="grid place-items-center h-7 w-7 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white hover:opacity-90 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlay}
                  aria-label={t("modal.play")}
                  className="grid place-items-center h-7 w-7 rounded-full bg-white text-black hover:bg-white/85 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </button>
              )}
              {token && (
                <button
                  type="button"
                  onClick={handleToggle}
                  aria-label={saved ? t("modal.inMyList") : t("modal.myList")}
                  className={cn(
                    "grid place-items-center h-7 w-7 rounded-full border text-white cursor-pointer transition-colors",
                    saved
                      ? "border-orange-500 bg-orange-500/30 text-orange-300 hover:bg-orange-500/40"
                      : "border-white/40 hover:border-white"
                  )}
                >
                  {saved ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
            {item.genres.length > 0 && (
              <p className="text-[10px] md:text-xs text-white/80 line-clamp-1">
                {item.genres.slice(0, 3).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};

export default MediaRailCard;
