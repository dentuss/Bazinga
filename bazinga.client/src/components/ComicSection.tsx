import MediaCard from "./MediaCard";
import Rail from "./Rail";

interface ComicLike {
  image: string;
  title: string;
  creators?: string;
  score?: number | null;
}

interface ComicSectionProps<T extends ComicLike> {
  id: string;
  title: string;
  comics: T[];
  showViewAll?: boolean;
  viewAllHref?: string;
  onComicClick?: (comic: T) => void;
}

/**
 * Horizontal Netflix-style rail of comic / manga tiles. The earlier multi-row
 * grid layout produced a horizontal page scroll on certain widths and made the
 * homepage feel inert — this version keeps every section tight and discoverable
 * via the on-edge arrow buttons.
 */
function ComicSection<T extends ComicLike>({
  id,
  title,
  comics,
  showViewAll = true,
  viewAllHref,
  onComicClick,
}: ComicSectionProps<T>) {
  const hrefForRail = showViewAll ? viewAllHref : undefined;
  return (
    <Rail
      id={id}
      title={title}
      viewAllHref={hrefForRail}
      empty={comics.length === 0}
      emptyMessage="No issues to show yet."
    >
      {comics.map((comic, index) => (
        <MediaCard
          key={`${id}-${index}`}
          image={comic.image}
          title={comic.title}
          subtitle={comic.creators}
          score={comic.score}
          width="rail"
          onClick={() => onComicClick?.(comic)}
        />
      ))}
    </Rail>
  );
}

export default ComicSection;
