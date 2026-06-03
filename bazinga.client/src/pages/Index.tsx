import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import ComicSection from "@/components/ComicSection";
import Footer from "@/components/Footer";
import BrowseByFilter from "@/components/BrowseByFilter";
import ComicModal from "@/components/ComicModal";
import MangaUniverse from "@/components/MangaUniverse";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { fetchTopManga } from "@/lib/metadata";
import {
  placeholderCharacters,
  placeholderComics,
  placeholderCreators,
  type PlaceholderComic,
} from "@/data/placeholderComics";

export interface ComicDto {
  id: number;
  title: string;
  author?: string;
  description?: string;
  mainCharacter?: string;
  series?: string;
  image: string;
  price: number;
  category?: { name: string };
  createdAt?: string;
}

interface DisplayComic {
  id: number;
  title: string;
  series: string;
  character: string;
  creators: string;
  image: string;
  description?: string;
  createdAt?: string;
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedComic, setSelectedComic] = useState<DisplayComic | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [browseFilter, setBrowseFilter] = useState<{ type: string; value: string }>({
    type: "",
    value: "",
  });

  const { data: comics = [] } = useQuery<ComicDto[]>({
    queryKey: ["comics"],
    queryFn: () => apiFetch<ComicDto[]>("/api/comics"),
  });

  const topManga = useQuery({
    queryKey: ["manga-top", "creators"],
    queryFn: () => fetchTopManga(1, 24),
    staleTime: 30 * 60 * 1000,
  });

  // Comics from the DB get mapped to the same display shape as our placeholders.
  // If the DB returns nothing (fresh install / empty seed), we fall back to a
  // curated set of placeholders so the homepage is never empty.
  const dbComics = useMemo<DisplayComic[]>(
    () =>
      comics.map((c) => ({
        id: c.id,
        title: c.title,
        series: c.series ?? "",
        character: c.mainCharacter ?? "",
        creators: c.author ?? "",
        image: c.image,
        description: c.description,
        createdAt: c.createdAt,
      })),
    [comics]
  );

  const fallbackComics = useMemo<DisplayComic[]>(
    () =>
      placeholderComics.map<DisplayComic>((p: PlaceholderComic) => ({
        id: p.id,
        title: p.title,
        series: p.series,
        character: p.character,
        creators: p.creators,
        image: p.image,
        description: p.description,
        createdAt: p.releaseDate,
      })),
    []
  );

  const allComics: DisplayComic[] = dbComics.length > 0 ? dbComics : fallbackComics;

  const browseOptions = useMemo(() => {
    const sorted = (arr: string[]) =>
      Array.from(new Set(arr.filter((v) => v.trim().length > 0))).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    const creatorsFromManga = (topManga.data?.data ?? [])
      .flatMap((m) => m.authors)
      .map((a) => a.replace(/,\s+/g, " "));
    const creatorsFromComics = allComics.flatMap((c) =>
      c.creators.split(",").map((s) => s.trim())
    );
    return {
      series: ["All Series", ...sorted(allComics.map((c) => c.series))],
      character: [
        "All Characters",
        ...sorted([
          ...allComics.map((c) => c.character),
          ...placeholderCharacters,
        ]),
      ],
      creator: [
        "All Creators",
        ...sorted([...creatorsFromComics, ...creatorsFromManga, ...placeholderCreators]),
      ],
    };
  }, [allComics, topManga.data]);

  const searchQuery = searchParams.get("search") || "";
  const viewParam = searchParams.get("view");
  const viewAll = viewParam === "all";

  const filteredComics = useMemo(() => {
    let list = [...allComics];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.creators.toLowerCase().includes(q) ||
          c.series.toLowerCase().includes(q) ||
          c.character.toLowerCase().includes(q)
      );
    }
    if (browseFilter.value && !browseFilter.value.startsWith("All")) {
      list = list.filter((c) => {
        if (browseFilter.type === "series") return c.series === browseFilter.value;
        if (browseFilter.type === "character") return c.character === browseFilter.value;
        if (browseFilter.type === "creator")
          return c.creators.toLowerCase().includes(browseFilter.value.toLowerCase());
        return true;
      });
    }
    return list;
  }, [searchQuery, browseFilter, allComics]);

  const newThisWeek = useMemo(
    () =>
      [...allComics]
        .sort(
          (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        )
        .slice(0, 6),
    [allComics]
  );

  const isFiltered = Boolean(searchQuery) || Boolean(browseFilter.value) || viewAll;

  const handleComicClick = (comic: DisplayComic) => {
    setSelectedComic(comic);
    setIsModalOpen(true);
  };

  const handleBrowseFilterChange = (type: string, value: string) => {
    setBrowseFilter({ type, value });
  };

  const clearFilters = () => {
    setSearchParams({});
    setBrowseFilter({ type: "", value: "" });
  };

  // Pre-load the comic shape ComicModal expects (it still uses the legacy fields).
  const modalComic = selectedComic
    ? {
        ...selectedComic,
        author: selectedComic.creators,
        mainCharacter: selectedComic.character,
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="-mt-16">
          <HeroCarousel />
        </div>
        <BrowseByFilter
          onFilterChange={handleBrowseFilterChange}
          seriesOptions={browseOptions.series}
          characterOptions={browseOptions.character}
          creatorOptions={browseOptions.creator}
        />

        {isFiltered ? (
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">
                {searchQuery
                  ? `SEARCH RESULTS FOR "${searchQuery.toUpperCase()}"`
                  : viewAll
                    ? "ALL COMICS"
                    : "FILTERED RESULTS"}
                <span className="text-muted-foreground text-lg font-normal ml-2">
                  ({filteredComics.length} comics)
                </span>
              </h2>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {filteredComics.map((comic) => (
                <button
                  key={comic.id}
                  type="button"
                  onClick={() => handleComicClick(comic)}
                  className="group block text-left outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-md shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/20">
                    <img
                      src={comic.image}
                      alt={comic.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="mt-2 text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {comic.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{comic.creators}</p>
                </button>
              ))}
            </div>
            {filteredComics.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No comics found matching your criteria.
                </p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear all filters
                </Button>
              </div>
            )}
          </section>
        ) : (
          <>
            <ComicSection
              id="new-this-week"
              title="NEW THIS WEEK"
              comics={newThisWeek}
              showViewAll={false}
              onComicClick={handleComicClick}
            />
            <ComicSection
              id="all-comics"
              title="ALL COMICS"
              comics={allComics}
              viewAllHref="/comics?view=all"
              onComicClick={handleComicClick}
            />
            <MangaUniverse />
          </>
        )}
      </main>
      <Footer />

      {modalComic && (
        <ComicModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          comic={modalComic}
        />
      )}
    </div>
  );
};

export default Index;
