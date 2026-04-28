import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { resolveImageUrl } from "@/lib/images";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

type LibraryItem = {
  id: number;
  comic: {
    id: number;
    title: string;
    image: string;
    author?: string;
    description?: string;
    comicType?: string;
  };
};

const Library = () => {
  const { token } = useAuth();
  const { data: items = [] } = useQuery<LibraryItem[]>({
    queryKey: ["library"],
    queryFn: () => apiFetch<LibraryItem[]>("/api/library", { authToken: token ?? undefined }),
    enabled: Boolean(token),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Your Library</p>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Keep reading your digital collection.</h1>
            <p className="text-muted-foreground">
              Every Digital Read purchase shows up here so you can pick up where you left off.
            </p>
          </div>

          {!token ? (
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <p className="text-muted-foreground">Sign in to view your personal library.</p>
              <Link to="/auth">
                <Button size="lg">Sign in</Button>
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <p className="text-muted-foreground">Your library is empty. Start exploring Digital Read comics.</p>
              <Link to="/?view=digital">
                <Button size="lg">Browse Digital Read</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="group rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="relative overflow-hidden rounded-lg">
                    {item.comic.comicType === "ONLY_DIGITAL" && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-bold uppercase text-black shadow">
                        Digital Exclusive
                      </span>
                    )}
                    <img
                      src={resolveImageUrl(item.comic.image)}
                      alt={item.comic.title}
                      className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3 space-y-2">
                    <h3 className="text-base font-bold text-foreground line-clamp-2">{item.comic.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.comic.author}</p>
                    <Link to={`/read/${item.comic.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Read now
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Library;
