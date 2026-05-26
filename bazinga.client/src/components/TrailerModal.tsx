import { useNavigate } from "react-router-dom";
import { Play, Plus, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Trailer } from "@/data/trailers";

interface TrailerModalProps {
  trailer: Trailer;
  onClose: () => void;
}

const TrailerModal = ({ trailer, onClose }: TrailerModalProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${trailer.title} trailer`}
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

        <div className="relative aspect-video bg-black">
          <video
            key={trailer.id}
            src={trailer.src}
            className="absolute inset-0 h-full w-full object-contain bg-black"
            autoPlay
            controls
            playsInline
          />
        </div>

        <div className="px-6 py-5 space-y-4">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
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
              <Play className="h-4 w-4 fill-current" /> Play
            </Button>
            <Button
              variant="outline"
              className="border-orange-500/60 text-orange-400 hover:bg-orange-500/10"
            >
              <Plus className="h-4 w-4" /> My List
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ThumbsUp className="h-4 w-4" /> Like
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
