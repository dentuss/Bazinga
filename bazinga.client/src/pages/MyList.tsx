import { useState } from "react";
import { Link } from "react-router-dom";
import TVHeader from "@/components/TVHeader";
import CollectionView from "@/components/CollectionView";
import AnimeModal from "@/components/AnimeModal";
import ShowModal from "@/components/ShowModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/contexts/CollectionsContext";
import { parsePayload, type CollectionItem } from "@/lib/collections";
import type { AnimeDto, SuperheroShowDto } from "@/lib/metadata";

const animeFromItem = (item: CollectionItem): AnimeDto => {
  const payload = parsePayload<AnimeDto>(item);
  if (payload) return payload;
  return {
    malId: Number(item.contentId) || 0,
    title: item.title,
    imageUrl: item.image ?? null,
    largeImageUrl: item.image ?? null,
    genres: [],
    studios: [],
  };
};

const showFromItem = (item: CollectionItem): SuperheroShowDto => {
  const payload = parsePayload<SuperheroShowDto>(item);
  if (payload) return payload;
  return {
    id: Number(item.contentId) || 0,
    name: item.title,
    imageMedium: item.image ?? null,
    imageOriginal: item.image ?? null,
    genres: [],
  };
};

const MyList = () => {
  const { token, currentProfile } = useAuth();
  const { myList } = useCollections();
  const [openAnime, setOpenAnime] = useState<AnimeDto | null>(null);
  const [openShow, setOpenShow] = useState<SuperheroShowDto | null>(null);

  const handleOpen = (item: CollectionItem) => {
    if (item.kind === "show") setOpenShow(showFromItem(item));
    else setOpenAnime(animeFromItem(item));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TVHeader />
      <main>
        {!token ? (
          <div className="container mx-auto px-4 py-24 text-center space-y-4">
            <p className="text-muted-foreground">Sign in to view your list.</p>
            <Link to="/auth">
              <Button size="lg">Sign in</Button>
            </Link>
          </div>
        ) : (
          <CollectionView
            collection="mylist"
            items={myList}
            accent="orange"
            title={`${currentProfile?.name ?? "Your"} List`}
            subtitle="Anime and series you've saved. Each profile keeps its own list — add titles with the + My List button on any show."
            emptyMessage="Your list is empty. Tap '+ My List' on any anime or series to add it here."
            tabs={[
              { value: "all", label: "All" },
              { value: "anime", label: "Anime" },
              { value: "show", label: "Series" },
            ]}
            onOpen={handleOpen}
          />
        )}
      </main>

      {openAnime && <AnimeModal anime={openAnime} onClose={() => setOpenAnime(null)} />}
      {openShow && <ShowModal show={openShow} onClose={() => setOpenShow(null)} />}
    </div>
  );
};

export default MyList;
