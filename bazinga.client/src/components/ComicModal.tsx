import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    price?: number;
    comicType?: string;
  };
}

const ComicModal = ({ isOpen, onClose, comic }: ComicModalProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const price = comic.price || 4.99;
  const subscriptionType = user?.subscriptionType?.toLowerCase();
  const isUnlimited = subscriptionType === "unlimited";
  const isDigitalExclusive = comic.comicType === "ONLY_DIGITAL";
  const [purchaseType, setPurchaseType] = useState<"ORIGINAL" | "DIGITAL">(
    isDigitalExclusive ? "DIGITAL" : "ORIGINAL"
  );
  const comicId = comic.id.toString();
  const inWishlist = isInWishlist(comicId);
  const originalPrice = isUnlimited ? price * 0.5 : price;
  const digitalPrice = isUnlimited ? 0 : price * 0.75;
  const selectedPrice = purchaseType === "DIGITAL" ? digitalPrice : originalPrice;

  useEffect(() => {
    setPurchaseType(isDigitalExclusive ? "DIGITAL" : "ORIGINAL");
    setIsDescriptionExpanded(false);
  }, [isDigitalExclusive, comic.id]);

  const handleAddToCart = () => {
    addToCart({
      comicId,
      purchaseType,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(comicId);
    } else {
      addToWishlist({
        id: comicId,
        title: comic.title,
        image: comic.image,
        creators: comic.creators,
        price,
      });
    }
  };

  const handleSignInRedirect = () => {
    navigate("/auth");
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
                <div className="flex flex-col gap-2">
                  {isDigitalExclusive && (
                    <span className="text-xs font-semibold uppercase text-yellow-500">Digital Exclusive</span>
                  )}
                  <div className="flex flex-wrap items-baseline gap-3">
                    {selectedPrice === 0 ? (
                      <span className="text-2xl font-bold text-primary">FREE WITH UNLIMITED</span>
                    ) : (
                      <span className="text-3xl font-bold text-primary">${selectedPrice.toFixed(2)}</span>
                    )}
                    {selectedPrice !== price && (
                      <span className="text-sm text-muted-foreground line-through">${price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                {!isDigitalExclusive && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left transition ${
                        purchaseType === "ORIGINAL"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/60"
                      }`}
                      onClick={() => setPurchaseType("ORIGINAL")}
                    >
                      <p className="text-sm font-semibold">Original Copy</p>
                      <p className="text-xs text-muted-foreground">
                        {originalPrice === 0 ? "FREE WITH UNLIMITED" : `$${originalPrice.toFixed(2)}`}
                      </p>
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left transition ${
                        purchaseType === "DIGITAL"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/60"
                      }`}
                      onClick={() => setPurchaseType("DIGITAL")}
                    >
                      <p className="text-sm font-semibold">Digital Copy</p>
                      <p className="text-xs text-muted-foreground">
                        {digitalPrice === 0 ? "FREE WITH UNLIMITED" : `$${digitalPrice.toFixed(2)}`}
                      </p>
                    </button>
                  </div>
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
              {user ? (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={added}
                >
                  {added ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      ADDED TO CART
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {selectedPrice === 0 ? "ADD TO CART - FREE" : `ADD TO CART - $${selectedPrice.toFixed(2)}`}
                    </>
                  )}
                </Button>
              ) : (
                <Button variant="default" className="w-full" onClick={handleSignInRedirect}>
                  SIGN IN TO BUY
                </Button>
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
