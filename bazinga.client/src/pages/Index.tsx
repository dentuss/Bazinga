import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import ComicSection from "@/components/ComicSection";
import UnlimitedBanner from "@/components/UnlimitedBanner";
import Footer from "@/components/Footer";
import BrowseByFilter from "@/components/BrowseByFilter";
import ComicModal from "@/components/ComicModal";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { resolveImageUrl } from "@/lib/images";

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
  comicType?: string;
  createdAt?: string;
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedComic, setSelectedComic] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [browseFilter, setBrowseFilter] = useState<{ type: string; value: string }>({ type: "", value: "" });

  const { data: comics = [] } = useQuery<ComicDto[]>({
    queryKey: ["comics"],
    queryFn: () => apiFetch<ComicDto[]>("/api/comics"),
  });

  const searchQuery = searchParams.get("search") || "";
  const viewParam = searchParams.get("view");
  const viewAll = viewParam === "all";
  const viewDigital = viewParam === "digital";

  const handleComicClick = (comic: any) => {
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

  const allComics = comics.map((comic) => ({
    ...comic,
    creators: comic.author || "",
    series: comic.series || "",
    character: comic.mainCharacter || "",
    comicType: comic.comicType || "PHYSICAL_COPY",
  }));

  const browseOptions = useMemo(() => {
    const toSortedList = (values: string[]) =>
      Array.from(new Set(values.filter((value) => value.trim().length > 0))).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    return {
      series: ["All Series", ...toSortedList(allComics.map((comic) => comic.series))],
      character: ["All Characters", ...toSortedList(allComics.map((comic) => comic.character))],
      creator: ["All Creators", ...toSortedList(allComics.map((comic) => comic.creators))],
    };
  }, [allComics]);

  const digitalExclusiveComics = allComics.filter((comic) => comic.comicType === "ONLY_DIGITAL");

  const filteredComics = useMemo(() => {
    let comics = [...(viewDigital ? digitalExclusiveComics : allComics)];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      comics = comics.filter(
        (comic) =>
          comic.title.toLowerCase().includes(query) ||
          comic.creators.toLowerCase().includes(query) ||
          comic.series.toLowerCase().includes(query) ||
          comic.character.toLowerCase().includes(query)
      );
    }

    if (browseFilter.value && !browseFilter.value.startsWith("All")) {
      if (browseFilter.type === "series") {
        comics = comics.filter((comic) => comic.series === browseFilter.value);
      } else if (browseFilter.type === "character") {
        comics = comics.filter((comic) => comic.character === browseFilter.value);
      } else if (browseFilter.type === "creator") {
        comics = comics.filter(
          (comic) => comic.creators.toLowerCase() === browseFilter.value.toLowerCase()
        );
      }
    }

    return comics;
  }, [searchQuery, browseFilter, viewDigital, allComics, digitalExclusiveComics]);

  const isFiltered = searchQuery || browseFilter.value || viewAll || viewDigital;

  const newThisWeek = useMemo(
    () =>
      [...allComics]
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        )
        .slice(0, 6),
    [allComics]
  );
  const digitalRead = digitalExclusiveComics.slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroCarousel />
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
                    : viewDigital
                      ? "DIGITAL EXCLUSIVE"
                      : "FILTERED RESULTS"}
                <span className="text-muted-foreground text-lg font-normal ml-2">({filteredComics.length} comics)</span>
              </h2>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredComics.map((comic, index) => (
                <div
                  key={index}
                  onClick={() => handleComicClick(comic)}
                  className="cursor-pointer group"
                >
                  <div className="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:-translate-y-2">
                    {comic.comicType === "ONLY_DIGITAL" && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-bold uppercase text-black shadow">
                        Digital Exclusive
                      </span>
                    )}
                    <img
                      src={resolveImageUrl(comic.image)}
                      alt={comic.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="mt-2 text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {comic.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{comic.creators}</p>
                </div>
              ))}
            </div>
            {filteredComics.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No comics found matching your criteria.</p>
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
              id="digital-read" 
              title="DIGITAL EXCLUSIVE" 
              comics={digitalRead}
              viewAllHref="/?view=digital"
              onComicClick={handleComicClick}
            />
            <UnlimitedBanner />
            <ComicSection
              id="all-comics"
              title="ALL COMICS"
              comics={allComics}
              viewAllHref="/?view=all"
              onComicClick={handleComicClick}
            />
          </>
        )}
      </main>
      <Footer />
      
      {selectedComic && (
        <ComicModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          comic={selectedComic}
        />
      )}
    </div>
  );
};

export default Index;
