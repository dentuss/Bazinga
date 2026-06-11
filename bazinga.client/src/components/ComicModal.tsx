import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Heart, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveImageUrl } from "@/lib/images";

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
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const comicId = String(comic.id);
  const inWishlist = isInWishlist(comicId);
  const subscribed = hasComicsAccess(user?.subscriptionType);

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

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(comicId);
    } else {
      addToWishlist({
        id: comicId,
        title: comic.title,
        image: comic.image,
        creators: comic.creators,
        price: 0,
      });
    }
  };

  const handleRead = () => {
    onClose();
    navigate(`/read/${comic.id}`);
  };

  const description =
    comic.description ??
    "An epic adventure awaits in this thrilling comic series. Join your favourite heroes as they battle against the forces of evil and protect the universe from destruction.";

  return (
    <div
      className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${comic.title} details`}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl overflow-hidden border border-primary/40 bg-card shadow-[0_0_60px_hsl(0_82%_55%/0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="relative bg-black aspect-[2/3] md:aspect-auto">
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

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{comic.title}</h2>
              {comic.series && (
                <p className="text-sm text-muted-foreground">{comic.series}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {comic.issueNumber && (
                <span className="font-bold text-primary">Issue #{comic.issueNumber}</span>
              )}
              {comic.year && <span className="text-muted-foreground">{comic.year}</span>}
              <span className="text-muted-foreground">{comic.creators}</span>
            </div>

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
                {expanded ? "Show less" : "Read more"}
              </button>
            )}

            {comic.creators && (
              <p className="text-xs">
                <span className="text-muted-foreground mr-1">Authors:</span>
                {comic.creators}
              </p>
            )}

            {comic.genres && comic.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {comic.genres.map((g) => (
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
                  <Link to="/auth">Sign in to read</Link>
                </Button>
              ) : subscribed ? (
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-[1.03]"
                  onClick={handleRead}
                >
                  <BookOpen className="h-4 w-4" />
                  Read Now
                </Button>
              ) : (
                <Button asChild className="bg-gradient-to-r from-primary to-orange-500 text-white">
                  <Link to="/bazinga-unlimited" onClick={onClose}>
                    <Sparkles className="h-4 w-4" />
                    Subscribe to read
                  </Link>
                </Button>
              )}
              {user && (
                <Button variant="outline" onClick={handleWishlistToggle}>
                  <Heart className={`h-4 w-4 ${inWishlist ? "fill-current text-primary" : ""}`} />
                  {inWishlist ? "In wishlist" : "Add to wishlist"}
                </Button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Part of the{" "}
              <span className="text-foreground font-semibold">{comic.series ?? "Bazinga"}</span>{" "}
              line on Bazinga Comics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComicModal;
