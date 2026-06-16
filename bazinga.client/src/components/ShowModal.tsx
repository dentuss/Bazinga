import { Check, Play, Plus, ThumbsUp, X } from "lucide-react";
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
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">{show.name}</h2>
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
        <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {stripHtml(show.summary) || "No summary available."}
          </p>
          <div className="flex flex-wrap gap-3">
            {show.officialSite ? (
              <a href={show.officialSite} target="_blank" rel="noreferrer">
                <Button className="bg-orange-500 text-black hover:bg-orange-600 font-bold">
                  <Play className="h-4 w-4 fill-current" /> Watch on {show.networkName ?? "official site"}
                </Button>
              </a>
            ) : (
              <Button className="bg-orange-500 text-black hover:bg-orange-600 font-bold">
                <Play className="h-4 w-4 fill-current" /> Play
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
                {saved ? "In My List" : "My List"}
              </Button>
            )}
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ThumbsUp className="h-4 w-4" /> Like
            </Button>
          </div>
          {show.genres.length > 0 && (
            <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
              <span className="text-white/70">Genres:</span>
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
