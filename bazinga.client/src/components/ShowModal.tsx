import { Check, Play, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { showMetaLine, stripHtml, type SuperheroShowDto } from "@/lib/metadata";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/contexts/CollectionsContext";

interface ShowModalProps {
  show: SuperheroShowDto;
  onClose: () => void;
}

/**
 * Shared superhero-show detail modal (orange/TV theme). Used by the BazingaTV
 * shelf, the Series catalogue, My List and master search — the "My List"
 * toggle is wired to the active profile's collection.
 */
const ShowModal = ({ show, onClose }: ShowModalProps) => {
  const { token } = useAuth();
  const { isSaved, toggle } = useCollections();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const saved = isSaved("mylist", "show", String(show.id));

  const handleToggle = () =>
    void toggle("mylist", {
      kind: "show",
      contentId: String(show.id),
      title: show.name,
      image: show.imageMedium ?? show.imageOriginal ?? null,
      subtitle: showMetaLine(show) || show.genres.slice(0, 3).join(" · "),
      payload: show,
    });

  const handlePlay = () => {
    onClose();
    navigate(`/bazinga-tv/watch/show-${show.id}`);
  };

  return (
    <div
      className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-2 sm:my-0 rounded-xl overflow-hidden border border-orange-500/40 bg-card shadow-[0_0_60px_hsl(25_95%_55%/0.4)] max-h-[calc(100dvh-16px)] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/80 hover:bg-black ring-1 ring-white/20 flex items-center justify-center"
          aria-label={t("modal.close")}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative aspect-video shrink-0">
          {show.imageOriginal || show.imageMedium ? (
            <img
              src={show.imageOriginal ?? show.imageMedium!}
              alt={show.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-orange-500/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">{show.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/85">
              {show.rating !== null && show.rating !== undefined && (
                <span className="font-bold text-green-500">★ {show.rating.toFixed(1)}</span>
              )}
              {show.premiered && <span>{show.premiered.slice(0, 4)}</span>}
              {show.status && (
                <span className="border border-white/40 px-2 py-0.5 text-xs">{show.status}</span>
              )}
              {show.networkName && <span>{show.networkName}</span>}
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {stripHtml(show.summary) || t("modal.noSummary")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-orange-500 text-black hover:bg-orange-600 font-bold"
              onClick={handlePlay}
            >
              <Play className="h-4 w-4 fill-current" /> {t("modal.play")}
            </Button>
            {token && (
              <Button
                variant="outline"
                onClick={handleToggle}
                className={
                  saved
                    ? "border-orange-500 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25"
                    : "border-orange-500/60 text-orange-400 hover:bg-orange-500/10"
                }
              >
                {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {saved ? t("modal.inMyList") : t("modal.myList")}
              </Button>
            )}
          </div>
          {show.genres.length > 0 && (
            <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
              <span className="text-white/70">{t("modal.genres")}:</span>
              {show.genres.map((g, i) => (
                <span key={g} className="text-orange-400">
                  {g}
                  {i < show.genres.length - 1 ? "," : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowModal;
