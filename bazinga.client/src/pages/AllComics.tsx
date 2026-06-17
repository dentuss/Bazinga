import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ComicCard from "@/components/ComicCard";
import ComicModal from "@/components/ComicModal";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { fetchMarvelComics } from "@/lib/metadata";
import {
  placeholderComics,
  type PlaceholderComic,
} from "@/data/placeholderComics";
import type { ComicDto } from "@/pages/Index";
import { cn } from "@/lib/utils";

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

const PAGE_SIZE = 18; // three rows × six cards on lg+

const AllComics = () => {
  const [searchParams] = useSearchParams();
  const masterQuery = (searchParams.get("search") ?? "").trim();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DisplayComic | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [masterQuery]);

  const { data: dbComics = [] } = useQuery<ComicDto[]>({
    queryKey: ["comics"],
    queryFn: () => apiFetch<ComicDto[]>("/api/comics"),
  });

  // Real Marvel issues, paginated server-side. Marvel's title search is a
  // prefix-only match (`titleStartsWith=`), so when the user lands here from a
  // master-search free-text query we still pass it through — Marvel will match
  // it as far as it can, and the local filter below tightens the rest.
  const marvelQuery = useQuery({
    queryKey: ["marvel-comics", "catalog", masterQuery || "", page],
    queryFn: () =>
      fetchMarvelComics({
        page,
        limit: PAGE_SIZE,
        q: masterQuery || undefined,
        orderBy: "-onsaleDate",
      }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 60 * 1000,
  });
  const marvelConfigured = marvelQuery.data?.configured === true;
  const marvelTotal = marvelQuery.data?.total ?? 0;

  // Three sources, in order of preference: real Marvel data → DB comics →
  // the placeholder catalogue. We collapse them into the same DisplayComic
  // shape so the rest of the page is unchanged.
  const all = useMemo<DisplayComic[]>(() => {
    if (marvelConfigured && (marvelQuery.data?.data?.length ?? 0) > 0) {
      return marvelQuery.data!.data.map<DisplayComic>((m) => ({
        id: m.id,
        title: m.title,
        series: m.series ?? "",
        character: m.characters[0] ?? "",
        creators: m.creators.join(", "),
        image: m.image ?? m.thumbnail ?? "",
        description: m.description ?? undefined,
        createdAt: m.onSaleDate ?? undefined,
      }));
    }
    if (dbComics.length > 0) {
      return dbComics.map((c) => ({
        id: c.id,
        title: c.title,
        series: c.series ?? "",
        character: c.mainCharacter ?? "",
        creators: c.author ?? "",
        image: c.image,
        description: c.description,
        createdAt: c.createdAt,
      }));
    }
    return placeholderComics.map<DisplayComic>((p: PlaceholderComic) => ({
      id: p.id,
      title: p.title,
      series: p.series,
      character: p.character,
      creators: p.creators,
      image: p.image,
      description: p.description,
      createdAt: p.releaseDate,
    }));
  }, [dbComics, marvelConfigured, marvelQuery.data]);

  // When we're paging through Marvel server-side, the local search filter is
  // a no-op (server already filtered). For DB / placeholder sources we apply
  // the same in-memory filter we always did.
  const filtered = useMemo(() => {
    if (marvelConfigured) return all;
    if (!masterQuery) return all;
    const q = masterQuery.toLowerCase();
    return all.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.creators.toLowerCase().includes(q) ||
        c.series.toLowerCase().includes(q) ||
        c.character.toLowerCase().includes(q)
    );
  }, [masterQuery, all, marvelConfigured]);

  // Deep-link: ?openComic=<id> pops the modal as if the card was clicked.
  const openComicId = searchParams.get("openComic");
  useEffect(() => {
    if (!openComicId || selected) return;
    const match = all.find((c) => c.id === Number(openComicId));
    if (match) {
      setSelected(match);
      setModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openComicId, all]);

  // Marvel paginates server-side, so the slice is identity (already 1 page).
  // For DB / placeholder modes we still need to slice locally.
  const totalCount = marvelConfigured ? marvelTotal : filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = marvelConfigured
    ? filtered
    : filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, hsl(0 82% 55% / 0.22), transparent 65%), radial-gradient(ellipse at 70% 70%, hsl(25 95% 55% / 0.18), transparent 70%)",
            }}
          />
          <div className="relative container mx-auto px-4 md:px-8 py-14 md:py-20 text-center">
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-primary">
              Bazinga Comics
            </p>
            <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">
              All Comics
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              {marvelConfigured
                ? masterQuery
                  ? `${totalCount.toLocaleString()} issues matching "${masterQuery}", sourced live from Marvel.`
                  : `${totalCount.toLocaleString()} issues sourced live from the Marvel Comics catalogue.`
                : masterQuery
                  ? `${filtered.length} comics matching "${masterQuery}".`
                  : `${all.length} issues across every series in the Bazinga catalogue.`}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-8 py-10 md:py-14">
          {pageItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {masterQuery
                  ? `No comics match "${masterQuery}".`
                  : "Nothing here yet."}
              </p>
              {masterQuery && (
                <Button variant="link" asChild className="mt-2">
                  <a href="/comics/all">Clear search</a>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {pageItems.map((c) => (
                <ComicCard
                  key={c.id}
                  image={c.image}
                  title={c.title}
                  creators={c.creators}
                  onClick={() => {
                    setSelected(c);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <PagerButton
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                direction="prev"
              >
                Previous
              </PagerButton>
              <span className="text-sm text-muted-foreground">
                Page <strong className="text-foreground">{safePage}</strong> of {totalPages}
              </span>
              <PagerButton
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                direction="next"
              >
                Next
              </PagerButton>
            </div>
          )}
        </section>
      </main>
      <Footer />

      {selected && (
        <ComicModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          comic={{
            id: selected.id,
            title: selected.title,
            image: selected.image,
            creators: selected.creators,
            description: selected.description,
            series: selected.series,
            year: selected.createdAt?.slice(0, 4),
          }}
        />
      )}
    </div>
  );
};

const PagerButton = ({
  disabled,
  onClick,
  direction,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  direction: "prev" | "next";
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-semibold transition-all duration-200",
      "hover:border-primary/60 hover:-translate-y-0.5",
      "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
    )}
  >
    {direction === "prev" && <ChevronLeft className="h-4 w-4" />}
    {children}
    {direction === "next" && <ChevronRight className="h-4 w-4" />}
  </button>
);

export default AllComics;
