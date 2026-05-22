import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Sparkles } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    comicType?: string;
  };
}

const hasComicsAccess = (subscriptionType?: string) => {
  const sub = subscriptionType?.toLowerCase();
  return sub === "comics" || sub === "unlimited" || sub === "premium";
};

const ComicModal = ({ isOpen, onClose, comic }: ComicModalProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const comicId = comic.id.toString();
  const inWishlist = isInWishlist(comicId);
  const subscribed = hasComicsAccess(user?.subscriptionType);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [comic.id]);

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

  const handleSignInRedirect = () => {
    navigate("/auth");
  };

  const handleRead = () => {
    onClose();
    navigate(`/read/${comic.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[calc(100%-1.5rem)] sm:w-full max-h-[90vh] p-0 overflow-hidden">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-bold">{comic.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={resolveImageUrl(comic.image)}
                  alt={comic.title}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div className="flex flex-col gap-4">
                {comic.comicType === "ONLY_DIGITAL" && (
                  <span className="self-start text-[10px] font-semibold uppercase tracking-wider rounded-full bg-yellow-400 text-black px-2 py-1">
                    Digital Exclusive
                  </span>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">CREATORS</h3>
                  <p className="text-lg">{comic.creators}</p>
                </div>
                {comic.year && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">YEAR</h3>
                    <p className="text-lg">{comic.year}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">DESCRIPTION</h3>
                  <p
                    className={`text-sm leading-relaxed transition-all ${
                      isDescriptionExpanded ? "max-h-none" : "max-h-24 overflow-hidden"
                    }`}
                  >
                    {comic.description ||
                      "An epic adventure awaits in this thrilling comic series. Join your favorite heroes as they battle against the forces of evil and protect the universe from destruction."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                    className="mt-2 text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    {isDescriptionExpanded ? "Show less" : "Read more"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-border bg-background/95 px-6 py-4">
            <div className="flex flex-col gap-2">
              {!user ? (
                <Button variant="default" className="w-full" onClick={handleSignInRedirect}>
                  SIGN IN TO READ
                </Button>
              ) : subscribed ? (
                <Button variant="default" className="w-full" onClick={handleRead}>
                  <BookOpen className="h-4 w-4" />
                  READ NOW
                </Button>
              ) : (
                <Link to="/bazinga-unlimited" onClick={onClose} className="block">
                  <Button className="w-full bg-gradient-to-r from-primary via-primary to-orange-500 hover:opacity-90 text-white font-bold uppercase tracking-wider border-0">
                    <Sparkles className="h-4 w-4" />
                    Subscribe to read
                  </Button>
                </Link>
              )}
              {user && (
                <Button
                  variant={inWishlist ? "secondary" : "outline"}
                  className="w-full"
                  onClick={handleWishlistToggle}
                >
                  <Heart className={`h-4 w-4 mr-2 ${inWishlist ? "fill-current" : ""}`} />
                  {inWishlist ? "IN WISHLIST" : "ADD TO WISHLIST"}
                </Button>
              )}
              <Button variant="ghost" className="w-full" onClick={onClose}>
                BACK TO CATALOG
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComicModal;
