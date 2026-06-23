import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import ComicSection from "@/components/ComicSection";
import Footer from "@/components/Footer";
import BrowseByFilter from "@/components/BrowseByFilter";
import ComicModal from "@/components/ComicModal";
import MangaUniverse from "@/components/MangaUniverse";
import MangaModal from "@/components/MangaModal";
import { Button } from "@/components/ui/button";
import {
  comicMetaCreators,
  fetchComicsMeta,
  fetchTopManga,
  type ComicMetaDto,
  type MangaDto,
} from "@/lib/metadata";

interface DisplayComic {
  id: number;
  title: string;
  series: string;
  character: string;
  creators: string;
  image: string;
  description?: string;
  createdAt?: string;
  metaId?: number;
}

const HOME_COMIC_LIMIT = 20;
const NEW_THIS_WEEK_TOTAL = 12;

interface MixedTile {
  image: string;
  title: string;
  creators?: string;
  score?: number | null;
  _comic?: DisplayComic;
  _manga?: MangaDto;
  _meta?: ComicMetaDto;
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [selectedComic, setSelectedComic] = useState<DisplayComic | null>(null);
  const [selectedManga, setSelectedManga] = useState<MangaDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [browseFilter, setBrowseFilter] = useState<{ type: string; value: string }>({
    type: "",
    value: "",
  });

  const topManga = useQuery({
    queryKey: ["manga-top", "home-mix"],
    queryFn: () => fetchTopManga(1, 12),
    staleTime: 30 * 60 * 1000,
  });

  // Wide metadata pull so BROWSE BY chips have something to work with.
  const comicsMetaQuery = useQuery({
    queryKey: ["comics-meta", "home", 1],
    queryFn: () => fetchComicsMeta({ page: 1, limit: 36 }),
    staleTime: 60 * 60 * 1000,
  });
  const comicsMetaNewQuery = useQuery({
    queryKey: ["comics-meta", "home", 2],
    queryFn: () => fetchComicsMeta({ page: 2, limit: 12 }),
    staleTime: 30 * 60 * 1000,
  });
  const metaHomeIssues = comicsMetaQuery.data?.data ?? [];
  const metaNewIssues = comicsMetaNewQuery.data?.data ?? [];

  // The browse-by chips are now sourced entirely from live metadata: series,
  // creators and genres collected from the comics we actually have on screen.
  const browseOptions = useMemo(() => {
    const sorted = (arr: string[]) =>
      Array.from(new Set(arr.filter((v) => v.trim().length > 0))).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    const allMeta = [...metaHomeIssues, ...metaNewIssues];
    return {
      series: [t("comics.allSeries"), ...sorted(allMeta.map((m) => m.series ?? ""))],
      creator: [t("comics.allCreators"), ...sorted(allMeta.flatMap((m) => m.creators))],
      genre: [t("comics.allGenres"), ...sorted(allMeta.flatMap((m) => m.genres))],
      year: [
        t("comics.allYears"),
        ...sorted(allMeta.map((m) => (m.year ? String(m.year) : ""))).reverse(),
      ],
    };
  }, [metaHomeIssues, metaNewIssues, t]);

  const searchQuery = searchParams.get("search") || "";
  const viewAll = searchParams.get("view") === "all";

  // Build a unified list of all metadata comics for filtering / search.
  const allMetaComics = useMemo<DisplayComic[]>(() => {
    const merged = [...metaHomeIssues, ...metaNewIssues];
    return merged.map<DisplayComic>((m) => ({
      id: m.id,
      title: m.title,
      series: m.series ?? "",
      character: "",
      creators: comicMetaCreators(m),
      image: m.image ?? m.thumbnail ?? "",
      description: m.description ?? undefined,
      createdAt: m.year ? `${m.year}` : undefined,
      metaId: m.id,
    }));
  }, [metaHomeIssues, metaNewIssues]);

  const filteredComics = useMemo(() => {
    let list = [...allMetaComics];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.creators.toLowerCase().includes(q) ||
          c.series.toLowerCase().includes(q)
      );
    }
    if (browseFilter.value && !browseFilter.value.startsWith(t("comics.allSeries").split(" ")[0])) {
      const isAll = browseFilter.value.toLowerCase().includes("all");
      if (!isAll) {
        list = list.filter((c) => {
          const meta = [...metaHomeIssues, ...metaNewIssues].find((m) => m.id === c.id);
          if (!meta) return false;
          if (browseFilter.type === "series") return (meta.series ?? "") === browseFilter.value;
          if (browseFilter.type === "creator")
            return meta.creators.some((cr) =>
              cr.toLowerCase().includes(browseFilter.value.toLowerCase())
            );
          if (browseFilter.type === "genre")
            return meta.genres.some(
              (g) => g.toLowerCase() === browseFilter.value.toLowerCase()
            );
          if (browseFilter.type === "year")
            return meta.year && String(meta.year) === browseFilter.value;
          return true;
        });
      }
    }
    return list;
  }, [searchQuery, browseFilter, allMetaComics, metaHomeIssues, metaNewIssues, t]);

  const newThisWeek = useMemo<MixedTile[]>(() => {
    const half = Math.ceil(NEW_THIS_WEEK_TOTAL / 2);
    const comicTiles: MixedTile[] = metaNewIssues.slice(0, half).map((m) => ({
      image: m.image ?? m.thumbnail ?? "",
      title: m.title,
      creators: comicMetaCreators(m),
      _meta: m,
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
    const out: MixedTile[] = [];
    const max = Math.max(comicTiles.length, mangaSlice.length);
    for (let i = 0; i < max; i++) {
      if (comicTiles[i]) out.push(comicTiles[i]);
      if (mangaSlice[i]) out.push(mangaSlice[i]);
    }
    return out.slice(0, NEW_THIS_WEEK_TOTAL);
  }, [topManga.data, metaNewIssues]);

  const homeComics = useMemo<MixedTile[]>(
    () =>
      metaHomeIssues.slice(0, HOME_COMIC_LIMIT).map((m) => ({
        image: m.image ?? m.thumbnail ?? "",
        title: m.title,
        creators: comicMetaCreators(m),
        _meta: m,
      })),
    [metaHomeIssues]
  );

  const isFiltered = Boolean(searchQuery) || Boolean(browseFilter.value) || viewAll;

  const handleTileClick = (item: MixedTile) => {
    if (item._manga) {
      setSelectedManga(item._manga);
      return;
    }
    if (item._meta) {
      const m = item._meta;
      setSelectedComic({
        id: m.id,
        title: m.title,
        series: m.series ?? "",
        character: "",
        creators: comicMetaCreators(m),
        image: m.image ?? m.thumbnail ?? "",
        description: m.description ?? undefined,
        createdAt: m.year ? `${m.year}` : undefined,
        metaId: m.id,
      });
      setIsModalOpen(true);
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
        year: selectedComic.createdAt?.slice(0, 4),
        metaId: selectedComic.metaId,
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
          genreOptions={browseOptions.genre}
          yearOptions={browseOptions.year}
        />

        {isFiltered ? (
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-foreground">
                {searchQuery
                  ? `${t("comics.searchResults")} "${searchQuery.toUpperCase()}"`
                  : viewAll
                    ? t("comics.comicsTitle")
                    : t("comics.filteredResults")}
                <span className="text-muted-foreground text-lg font-normal ml-2">
                  ({t("comics.countComics", { count: filteredComics.length })})
                </span>
              </h2>
              <Button variant="outline" onClick={clearFilters}>
                {t("comics.clearFilters")}
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
                <p className="text-muted-foreground text-lg">{t("comics.noMatches")}</p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  {t("comics.clearAll")}
                </Button>
              </div>
            )}
          </section>
        ) : (
          <>
            <ComicSection
              id="new-this-week"
              title={t("comics.newThisWeek")}
              comics={newThisWeek}
              showViewAll={false}
              onComicClick={handleTileClick}
            />
            <ComicSection
              id="comics"
              title={t("comics.comicsTitle")}
              comics={homeComics}
              viewAllHref="/comics/all"
              rows={2}
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
