import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ComicModal from "@/components/ComicModal";
import MangaModal from "@/components/MangaModal";
import CollectionView from "@/components/CollectionView";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/contexts/CollectionsContext";
import { parsePayload, type CollectionItem } from "@/lib/collections";
import type { MangaDto } from "@/lib/metadata";

type ComicPayload = {
  id: number;
  title: string;
  image: string;
  creators: string;
  description?: string;
  series?: string;
};

const comicFromItem = (item: CollectionItem): ComicPayload => {
  const payload = parsePayload<ComicPayload>(item);
  if (payload) return payload;
  return {
    id: Number(item.contentId) || 0,
    title: item.title,
    image: item.image ?? "",
    creators: item.subtitle ?? "",
  };
};

const mangaFromItem = (item: CollectionItem): MangaDto => {
  const payload = parsePayload<MangaDto>(item);
  if (payload) return payload;
  return {
    malId: Number(item.contentId) || 0,
    title: item.title,
    imageUrl: item.image ?? null,
    largeImageUrl: item.image ?? null,
    genres: [],
    authors: item.subtitle ? [item.subtitle] : [],
  };
};

const Library = () => {
  const { token, currentProfile } = useAuth();
  const { library } = useCollections();
  const [openComic, setOpenComic] = useState<ComicPayload | null>(null);
  const [openManga, setOpenManga] = useState<MangaDto | null>(null);

  const handleOpen = (item: CollectionItem) => {
    if (item.kind === "manga") setOpenManga(mangaFromItem(item));
    else setOpenComic(comicFromItem(item));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {!token ? (
          <div className="container mx-auto px-4 py-24 text-center space-y-4">
            <p className="text-muted-foreground">Sign in to view your library.</p>
            <Link to="/auth">
              <Button size="lg">Sign in</Button>
            </Link>
          </div>
        ) : (
          <CollectionView
            collection="library"
            items={library}
            accent="red"
            title={`${currentProfile?.name ?? "Your"} Library`}
            subtitle="Comics and manga you've saved. Each profile keeps its own library — add titles with the heart on any comic or manga."
            emptyMessage="Your library is empty. Tap the heart on a comic or manga to add it here."
            tabs={[
              { value: "all", label: "All" },
              { value: "comic", label: "Comics" },
              { value: "manga", label: "Manga" },
            ]}
            onOpen={handleOpen}
          />
        )}
      </main>
      <Footer />

      {openComic && (
        <ComicModal
          isOpen={true}
          onClose={() => setOpenComic(null)}
          comic={openComic}
        />
      )}
      {openManga && <MangaModal manga={openManga} onClose={() => setOpenManga(null)} />}
    </div>
  );
};

export default Library;
