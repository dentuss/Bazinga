import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BookOpen, Heart, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollections } from "@/contexts/CollectionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveImageUrl } from "@/lib/images";
import { fetchComicMeta } from "@/lib/metadata";

interface ComicModalProps {
  isOpen: boolean;
  onClose: () => void;
  comic: {
    id: number;
    title: string;
    image: string;
    creators: string;
    year?: string;
    description?: string;
    series?: string;
    issueNumber?: number;
    genres?: string[];
    /** Open Library work id — when set and no description was passed in, the
     * modal lazy-loads the description + genres from the metadata provider. */
    metaId?: number;
  };
}

const hasComicsAccess = (subscriptionType?: string) => {
  const sub = subscriptionType?.toLowerCase();
  return sub === "comics" || sub === "unlimited" || sub === "premium" || sub === "trial";
};

/**
 * Comic detail popup, restyled to mirror MangaModal: split layout with the
 * cover on the left and structured metadata on the right, an Add to wishlist
 * outline and a tight tag row for genres.
 */
const ComicModal = ({ isOpen, onClose, comic }: ComicModalProps) => {
  const { isSaved, toggle } = useCollections();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const comicId = String(comic.id);
  const inLibrary = isSaved("library", "comic", comicId);
  const subscribed = hasComicsAccess(user?.subscriptionType);

  // Lazy-load description + genres for metadata (Open Library) comics that only
  // arrived with cover/title/creators. No fetch for placeholder/DB comics.
  const { data: meta } = useQuery({
    queryKey: ["comic-meta", comic.metaId],
    queryFn: () => fetchComicMeta(comic.metaId!),
    enabled: isOpen && comic.metaId != null && !comic.description,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    setExpanded(false);
  }, [comic.id]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLibraryToggle = () => {
    void toggle("library", {
      kind: "comic",
      contentId: comicId,
      title: comic.title,
      image: comic.image,
      subtitle: comic.creators,
      payload: comic,
    });
  };

  const handleRead = () => {
    onClose();
    navigate(`/read/${comic.id}`);
  };

  const description =
    comic.description ??
    meta?.description ??
    "";

  const genres = comic.genres ?? meta?.genres;

  return (
    <div
      className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${comic.title} details`}
    >
      <div
        className="relative w-full max-w-3xl my-2 sm:my-0 rounded-xl overflow-hidden border border-primary/40 bg-card shadow-[0_0_60px_hsl(0_82%_55%/0.4)] max-h-[calc(100dvh-16px)] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/80 hover:bg-black ring-1 ring-white/20 flex items-center justify-center transition-colors"
          aria-label={t("modal.close")}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr] overflow-y-auto">
          <div className="relative bg-black aspect-[16/9] sm:aspect-auto sm:min-h-[280px]">
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/15 to-orange-500/30"
            />
            <div aria-hidden className="absolute inset-0 grid place-items-center text-center px-4">
              <span className="text-sm font-black uppercase tracking-wider text-white/85 line-clamp-3 drop-shadow">
                {comic.title}
              </span>
            </div>
            <img
              src={resolveImageUrl(comic.image)}
              alt={comic.title}
              className="relative h-full w-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")}
            />
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight pr-12">{comic.title}</h2>
              {comic.series && (
                <p className="text-sm text-muted-foreground">{comic.series}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {comic.issueNumber && (
                <span className="font-bold text-primary">{t("modal.issue")} #{comic.issueNumber}</span>
              )}
              {comic.year && <span className="text-muted-foreground">{comic.year}</span>}
              <span className="text-muted-foreground">{comic.creators}</span>
            </div>

            {description && (
              <>
                <p
                  className={`text-sm text-muted-foreground leading-relaxed transition-[max-height] ${
                    expanded ? "max-h-none" : "max-h-24 overflow-hidden"
                  }`}
                >
                  {description}
                </p>
                {description.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((p) => !p)}
                    className="text-xs font-bold text-primary hover:text-primary/80"
                  >
                    {expanded ? t("modal.showLess") : t("modal.readMore")}
                  </button>
                )}
              </>
            )}

            {comic.creators && (
              <p className="text-xs">
                <span className="text-muted-foreground mr-1">{t("modal.authors")}:</span>
                {comic.creators}
              </p>
            )}

            {genres && genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {!user ? (
                <Button asChild>
                  <Link to="/auth">{t("modal.signInToRead")}</Link>
                </Button>
              ) : subscribed ? (
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-[1.03]"
                  onClick={handleRead}
                >
                  <BookOpen className="h-4 w-4" />
                  {t("modal.readNow")}
                </Button>
              ) : (
                <Button asChild className="bg-gradient-to-r from-primary to-orange-500 text-white">
                  <Link to="/bazinga-unlimited" onClick={onClose}>
                    <Sparkles className="h-4 w-4" />
                    {t("modal.subscribeToRead")}
                  </Link>
                </Button>
              )}
              {user && (
                <Button
                  variant="outline"
                  onClick={handleLibraryToggle}
                  className={inLibrary ? "border-primary bg-primary/10 text-primary hover:bg-primary/20" : ""}
                >
                  <Heart className={`h-4 w-4 ${inLibrary ? "fill-current text-primary" : ""}`} />
                  {inLibrary ? t("modal.inLibrary") : t("modal.addToLibrary")}
                </Button>
              )}
            </div>

            {comic.series && (
              <p className="text-[11px] text-muted-foreground">
                {t("modal.partOfLine", { series: comic.series })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComicModal;
