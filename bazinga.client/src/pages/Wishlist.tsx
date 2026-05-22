import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, BookOpen, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveImageUrl } from "@/lib/images";

const hasComicsAccess = (subscriptionType?: string) => {
  const sub = subscriptionType?.toLowerCase();
  return sub === "comics" || sub === "unlimited" || sub === "premium";
};

const Wishlist = () => {
  const { items, removeFromWishlist } = useWishlist();
  const { user } = useAuth();
  const subscribed = hasComicsAccess(user?.subscriptionType);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/comics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary" />
            MY WISHLIST
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Save comics here to read them later
            </p>
            <Link to="/comics">
              <Button>BROWSE COMICS</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg overflow-hidden group"
              >
                <div className="aspect-[2/3] overflow-hidden">
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground line-clamp-2 mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{item.creators}</p>
                  <div className="flex gap-2">
                    {subscribed ? (
                      <Link to={`/read/${item.id}`} className="flex-1">
                        <Button className="w-full" size="sm">
                          <BookOpen className="h-4 w-4 mr-1" />
                          READ
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/bazinga-unlimited" className="flex-1">
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-primary via-primary to-orange-500 text-white border-0"
                        >
                          SUBSCRIBE
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFromWishlist(item.id)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
