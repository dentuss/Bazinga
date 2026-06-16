import { useQuery } from "@tanstack/react-query";
import { Check, Play, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAnime, type AnimeDto } from "@/lib/metadata";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/contexts/CollectionsContext";
import heroBanner1 from "@/assets/hero-banner-1.jpg";
import heroBanner2 from "@/assets/hero-banner-2.jpg";
import heroBanner3 from "@/assets/hero-banner-3.jpg";

const fallbackBackdrops = [heroBanner1, heroBanner2, heroBanner3];
const backdropFor = (id: number) => fallbackBackdrops[id % fallbackBackdrops.length];

const matchPercent = (a: AnimeDto): number => {
  if (typeof a.score === "number") return Math.max(70, Math.min(99, Math.round(a.score * 10)));
  return 78 + ((a.malId * 3) % 22);
};

const ratingLabel = (a: AnimeDto): string => {
  if (a.rating) return a.rating.split(" ")[0];
  if (a.type === "Movie") return "MOV";
  return "TV";
};

const seasonCount = (a: AnimeDto): number | null => {
  if (!a.episodes) return null;
  if (a.episodes <= 26) return 1;
  if (a.episodes <= 52) return 2;
  return Math.min(5, Math.ceil(a.episodes / 24));
};

interface AnimeModalProps {
  anime: AnimeDto;
  onClose: () => void;
}

/**
 * Shared anime detail modal (orange/TV theme). Used on the BazingaTV home, the
 * Anime catalogue, My List and master search so the "My List" toggle behaves
 * identically everywhere.
 */
const AnimeModal = ({ anime, onClose }: AnimeModalProps) => {
  const { token } = useAuth();
  const { isSaved, toggle } = useCollections();
  const { data: detail } = useQuery({
    queryKey: ["anime-detail", anime.malId],
    queryFn: () => fetchAnime(anime.malId),
    staleTime: 10 * 60 * 1000,
  });
  const full = detail ?? anime;
  const backdrop =
    full.trailerImageUrl ?? full.largeImageUrl ?? full.imageUrl ?? backdropFor(full.malId);
  const seasons = seasonCount(full);
  const saved = isSaved("mylist", "anime", String(full.malId));

  const handleToggle = () =>
    void toggle("mylist", {
      kind: "anime",
      contentId: String(full.malId),
      title: full.title,
      image: full.largeImageUrl ?? full.imageUrl ?? null,
      subtitle: [full.year, ratingLabel(full)].filter(Boolean).join(" · "),
      payload: full,
    });

  return (
    <div
      className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl overflow-hidden border border-orange-500/40 bg-card shadow-[0_0_60px_hsl(25_95%_55%/0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative aspect-video">
          <img src={backdrop} alt={full.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">{full.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/85">
              <span className="font-bold text-green-500">{matchPercent(full)}% Match</span>
              {full.year && <span>{full.year}</span>}
              <span className="border border-white/40 px-2 py-0.5 text-xs">{ratingLabel(full)}</span>
              {seasons ? (
                <span>
                  {seasons} Season{seasons > 1 ? "s" : ""}
                </span>
              ) : full.episodes ? (
                <span>{full.episodes} episodes</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {full.synopsis ?? "No synopsis yet."}
          </p>
          {full.studios.length > 0 && (
            <p className="text-xs text-white/70">
              <span className="text-white/50 mr-1">Studios:</span>
              {full.studios.join(", ")}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button className="bg-orange-500 text-black hover:bg-orange-600 font-bold">
              <Play className="h-4 w-4 fill-current" /> Play
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
                {saved ? "In My List" : "My List"}
              </Button>
            )}
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ThumbsUp className="h-4 w-4" /> Like
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ThumbsDown className="h-4 w-4" /> Not for me
            </Button>
          </div>
          {full.genres.length > 0 && (
            <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
              <span className="text-white/70">Genres:</span>
              {full.genres.map((g, i) => (
                <span key={g} className="text-orange-400">
                  {g}
                  {i < full.genres.length - 1 ? "," : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimeModal;
