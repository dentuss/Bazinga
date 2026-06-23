import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Play, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Trailer } from "@/data/trailers";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/contexts/CollectionsContext";

interface TrailerModalProps {
  trailer: Trailer;
  onClose: () => void;
}

const TrailerModal = ({ trailer, onClose }: TrailerModalProps) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isSaved, toggle } = useCollections();
  const { t } = useTranslation();
  const saved = isSaved("mylist", "show", `trailer-${trailer.id}`);

  const handleToggle = () =>
    void toggle("mylist", {
      kind: "show",
      contentId: `trailer-${trailer.id}`,
      title: trailer.title,
      image: null,
      subtitle: trailer.tagline,
    });

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${trailer.title} trailer`}
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

        <div className="relative aspect-video bg-black shrink-0">
          <video
            key={trailer.id}
            src={trailer.src}
            className="absolute inset-0 h-full w-full object-contain bg-black"
            autoPlay
            controls
            playsInline
          />
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            {trailer.title}
          </h2>
          <p className="text-base text-orange-400 font-semibold">{trailer.tagline}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/85">
            <span>{trailer.year}</span>
            <span className="border border-white/40 px-2 py-0.5 text-xs">{trailer.rating}</span>
            <span className="text-white/70">{trailer.genres.join(" · ")}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{trailer.description}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-white text-black hover:bg-white/90 font-bold"
              onClick={() => navigate(`/bazinga-tv/watch/${trailer.id}`)}
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
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
