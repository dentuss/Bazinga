import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Play, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/contexts/CollectionsContext";
import { hasTVAccess } from "@/lib/access";

interface TrailerModalProps {
  media: MediaItem;
  onClose: () => void;
}

const TrailerModal = ({ media, onClose }: TrailerModalProps) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { isSaved, toggle } = useCollections();
  const { t } = useTranslation();
  // Stable id under the slug so the same item produces the same collection key
  // regardless of whether it's a trailer/show/movie row in the DB.
  const collectionKey = `media-${media.slug}`;
  const saved = isSaved("mylist", "show", collectionKey);
  const canWatch = hasTVAccess(user?.subscriptionType);

  const handleToggle = () =>
    void toggle("mylist", {
      kind: "show",
      contentId: collectionKey,
      title: media.title,
      image: media.posterImage ?? media.backdropImage ?? null,
      subtitle: media.tagline ?? undefined,
    });

  // Prefer the short trailer clip when set; otherwise fall back to the
  // backdrop image so the modal isn't empty above the metadata.
  const reelSrc = media.trailerUrl ?? undefined;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${media.title} trailer`}
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
          {reelSrc ? (
            <video
              key={media.id}
              src={reelSrc}
              poster={media.backdropImage ?? undefined}
              className="absolute inset-0 h-full w-full object-contain bg-black"
              autoPlay
              controls
              playsInline
            />
          ) : media.backdropImage ? (
            <img
              src={media.backdropImage}
              alt={media.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            {media.title}
          </h2>
          {media.tagline && (
            <p className="text-base text-orange-400 font-semibold">{media.tagline}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/85">
            {media.year && <span>{media.year}</span>}
            {media.rating && (
              <span className="border border-white/40 px-2 py-0.5 text-xs">{media.rating}</span>
            )}
            {media.genres.length > 0 && (
              <span className="text-white/70">{media.genres.join(" · ")}</span>
            )}
          </div>
          {media.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{media.description}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {!user ? (
              <Button asChild className="bg-white text-black hover:bg-white/90 font-bold">
                <Link to="/auth">{t("modal.signInToWatch")}</Link>
              </Button>
            ) : canWatch ? (
              <Button
                className="bg-white text-black hover:bg-white/90 font-bold"
                onClick={() => navigate(`/bazinga-tv/watch/${media.slug}`)}
              >
                <Play className="h-4 w-4 fill-current" /> {t("modal.play")}
              </Button>
            ) : (
              <Button
                asChild
                className="bg-gradient-to-r from-primary to-orange-500 text-white font-bold"
              >
                <Link to="/bazinga-unlimited" onClick={onClose}>
                  <Sparkles className="h-4 w-4" />
                  {t("modal.subscribeToWatch")}
                </Link>
              </Button>
            )}
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
