import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import MediaCard from "./MediaCard";

interface ComicLike {
  image: string;
  title: string;
  creators?: string;
  score?: number | null;
}

interface ComicSectionProps<T extends ComicLike> {
  id?: string;
  title: string;
  comics: T[];
  showViewAll?: boolean;
  viewAllHref?: string;
  onComicClick?: (comic: T) => void;
}

function ComicSection<T extends ComicLike>({
  id,
  title,
  comics,
  showViewAll = true,
  viewAllHref,
  onComicClick,
}: ComicSectionProps<T>) {
  return (
    <section id={id} className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-black">{title}</h2>
          {showViewAll &&
            (viewAllHref ? (
              <Link
                to={viewAllHref}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
              >
                SEE ALL
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <button className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
                SEE ALL
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {comics.map((comic, index) => (
            <MediaCard
              key={index}
              image={comic.image}
              title={comic.title}
              subtitle={comic.creators}
              score={comic.score}
              onClick={() => onComicClick?.(comic)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ComicSection;
