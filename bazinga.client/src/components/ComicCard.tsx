import MediaCard from "@/components/MediaCard";

interface ComicCardProps {
  image: string;
  title: string;
  creators?: string;
  onClick?: () => void;
}

/** Comics-flavoured alias for {@link MediaCard} so the homepage and catalog
 *  use the exact same tile that the Manga rows use. */
const ComicCard = ({ image, title, creators, onClick }: ComicCardProps) => (
  <MediaCard image={image} title={title} subtitle={creators} onClick={onClick} />
);

export default ComicCard;
