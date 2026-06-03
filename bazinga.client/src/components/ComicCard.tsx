import { BookOpen } from "lucide-react";
import { resolveImageUrl } from "@/lib/images";

interface ComicCardProps {
  image: string;
  title: string;
  creators?: string;
  onClick?: () => void;
}

const ComicCard = ({ image, title, creators, onClick }: ComicCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-md bg-card text-left transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/30 hover:ring-2 hover:ring-primary/50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={resolveImageUrl(image)}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        {/* Subtle red glow on hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, hsl(0 82% 55% / 0.45), transparent 65%)",
          }}
        />
        {/* "Read" CTA on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 p-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg">
            <BookOpen className="h-3 w-3" />
            Read
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>
        {creators && (
          <p className="text-xs text-muted-foreground line-clamp-1">{creators}</p>
        )}
      </div>
    </button>
  );
};

export default ComicCard;
