import { resolveImageUrl } from "@/lib/images";

interface ComicCardProps {
  image: string;
  title: string;
  creators?: string;
  comicType?: string;
  onClick?: () => void;
}

const ComicCard = ({ image, title, creators, comicType, onClick }: ComicCardProps) => {
  const isDigitalExclusive = comicType === "ONLY_DIGITAL";

  return (
    <div 
      onClick={onClick}
      className="group relative overflow-hidden rounded-sm bg-card transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/20 cursor-pointer"
    >
      {isDigitalExclusive && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-bold uppercase text-black shadow">
          Digital Exclusive
        </span>
      )}
      <div className="aspect-[2/3] overflow-hidden">
        <img
          src={resolveImageUrl(image)}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {creators && (
          <p className="text-xs text-muted-foreground line-clamp-1">{creators}</p>
        )}
      </div>
    </div>
  );
};

export default ComicCard;
