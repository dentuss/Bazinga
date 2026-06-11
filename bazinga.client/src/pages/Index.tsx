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
import MangaModal from "@/components/MangaModal";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { fetchTopManga, type MangaDto } from "@/lib/metadata";
import {
  placeholderComics,
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

const HOME_COMIC_LIMIT = 20; // length of the horizontal rail on the homepage
const NEW_THIS_WEEK_TOTAL = 12; // single rail of comics + manga, mixed

// Carries enough state for a homepage tile to route its click to the right
// modal — extra fields beyond the visible image/title/creators stay attached.
interface MixedTile {
  image: string;
  title: string;
  creators?: string;
  score?: number | null;
  _comic?: DisplayComic;
  _manga?: MangaDto;
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedComic, setSelectedComic] = useState<DisplayComic | null>(null);
  const [selectedManga, setSelectedManga] = useState<MangaDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [browseFilter, setBrowseFilter] = useState<{ type: string; value: string }>({
    type: "",
    value: "",
  });

  const { data: comics = [] } = useQuery<ComicDto[]>({
    queryKey: ["comics"],
    queryFn: () => apiFetch<ComicDto[]>("/api/comics"),
  });

  // Tease the top manga so we can mix titles into New This Week without going
  // to the full Manga Universe section.
  const topManga = useQuery({
    queryKey: ["manga-top", "home-mix"],
    queryFn: () => fetchTopManga(1, 12),
    staleTime: 30 * 60 * 1000,
  });

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

  // Always use the placeholder catalogue on the home shelf — DB-stored comics
  // can ship without covers/descriptions which leaves the homepage looking
  // broken. The full catalog at /comics/all still merges DB results when present.
  const allComics: DisplayComic[] = fallbackComics;
  // Keep dbComics around to dedupe browse-filter options when populated.
  void dbComics;

  const browseOptions = useMemo(() => {
    const sorted = (arr: string[]) =>
      Array.from(new Set(arr.filter((v) => v.trim().length > 0))).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    // Creators come from the comics we can actually filter on (placeholder + DB),
    // not from the manga API — that mismatch is why the filter previously yielded
    // 0 results when a manga author chip was clicked.
    const creatorsFromComics = allComics.flatMap((c) =>
      c.creators.split(",").map((s) => s.trim())
    );
    return {
      series: ["All Series", ...sorted(allComics.map((c) => c.series))],
      creator: ["All Creators", ...sorted(creatorsFromComics)],
    };
  }, [allComics]);

  const searchQuery = searchParams.get("search") || "";
  const viewAll = searchParams.get("view") === "all";

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
        if (browseFilter.type === "creator")
          return c.creators.toLowerCase().includes(browseFilter.value.toLowerCase());
        return true;
      });
    }
    return list;
  }, [searchQuery, browseFilter, allComics]);

  /** "New This Week" = newest 3 comics + 3 newest top manga titles, mixed. */
  const newThisWeek = useMemo<MixedTile[]>(() => {
    const sortedComics: MixedTile[] = [...allComics]
      .sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      )
      .slice(0, Math.ceil(NEW_THIS_WEEK_TOTAL / 2))
      .map((c) => ({
        image: c.image,
        title: c.title,
        creators: c.creators,
        _comic: c,
      }));
    const mangaSlice: MixedTile[] = (topManga.data?.data ?? [])
      .slice(0, Math.floor(NEW_THIS_WEEK_TOTAL / 2))
      .map((m) => ({
        image: m.largeImageUrl ?? m.imageUrl ?? "",
        title: m.title,
        creators: m.authors.join(", "),
        score: m.score,
        _manga: m,
      }));
    // Interleave so it doesn't look segregated.
    const out: MixedTile[] = [];
    const max = Math.max(sortedComics.length, mangaSlice.length);
    for (let i = 0; i < max; i++) {
      if (sortedComics[i]) out.push(sortedComics[i]);
      if (mangaSlice[i]) out.push(mangaSlice[i]);
    }
    return out.slice(0, NEW_THIS_WEEK_TOTAL);
  }, [allComics, topManga.data]);

  const homeComics = useMemo<MixedTile[]>(
    () =>
      allComics.slice(0, HOME_COMIC_LIMIT).map((c) => ({
        image: c.image,
        title: c.title,
        creators: c.creators,
        _comic: c,
      })),
    [allComics]
  );

  const isFiltered = Boolean(searchQuery) || Boolean(browseFilter.value) || viewAll;

  const handleTileClick = (item: MixedTile) => {
    if (item._manga) {
      setSelectedManga(item._manga);
      return;
    }
    if (item._comic) {
      setSelectedComic(item._comic);
      setIsModalOpen(true);
    }
  };

  const handleBrowseFilterChange = (type: string, value: string) => {
    setBrowseFilter({ type, value });
  };

  const clearFilters = () => {
    setSearchParams({});
    setBrowseFilter({ type: "", value: "" });
  };

  const modalComic = selectedComic
    ? {
        id: selectedComic.id,
        title: selectedComic.title,
        image: selectedComic.image,
        creators: selectedComic.creators,
        description: selectedComic.description,
        series: selectedComic.series,
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
          creatorOptions={browseOptions.creator}
        />

        {isFiltered ? (
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">
                {searchQuery
                  ? `SEARCH RESULTS FOR "${searchQuery.toUpperCase()}"`
                  : viewAll
                    ? "COMICS"
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
                  onClick={() => {
                    setSelectedComic(comic);
                    setIsModalOpen(true);
                  }}
                  className="group block text-left outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-md shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/30">
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
              onComicClick={handleTileClick}
            />
            <ComicSection
              id="comics"
              title="COMICS"
              comics={homeComics}
              viewAllHref="/comics/all"
              onComicClick={handleTileClick}
            />
            <MangaUniverse mode="home" viewAllHref="/manga" />
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
      {selectedManga && (
        <MangaModal manga={selectedManga} onClose={() => setSelectedManga(null)} />
      )}
    </div>
  );
};

export default Index;
