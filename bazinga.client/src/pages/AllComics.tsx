import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ComicCard from "@/components/ComicCard";
import ComicModal from "@/components/ComicModal";
import { Button } from "@/components/ui/button";
import { comicMetaCreators, fetchComicsMeta } from "@/lib/metadata";
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
  metaId?: number;
}

const PAGE_SIZE = 18;

const AllComics = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const masterQuery = (searchParams.get("search") ?? "").trim();

  // Local search bar — same pattern as Series. Keeps page-level search next to
  // the catalogue so users don't have to bounce through the global Cmd-K.
  const [localQuery, setLocalQuery] = useState(masterQuery);
  const [debounced, setDebounced] = useState(masterQuery);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DisplayComic | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Keep the input synced when the URL changes (e.g. via the global search).
  useEffect(() => {
    setLocalQuery(masterQuery);
    setDebounced(masterQuery);
  }, [masterQuery]);

  // Debounce typing into the local input so we don't hammer Open Library.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(localQuery.trim()), 300);
    return () => clearTimeout(id);
  }, [localQuery]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const effectiveQuery = debounced || masterQuery;

  const metaQuery = useQuery({
    queryKey: ["comics-meta", "catalog", effectiveQuery || "", page],
    queryFn: () =>
      fetchComicsMeta({
        page,
        limit: PAGE_SIZE,
        q: effectiveQuery || undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 60 * 1000,
  });
  const metaIssues = metaQuery.data?.data ?? [];
  const metaTotal = metaQuery.data?.total ?? 0;

  const all = useMemo<DisplayComic[]>(
    () =>
      metaIssues.map<DisplayComic>((m) => ({
        id: m.id,
        title: m.title,
        series: m.series ?? "",
        character: "",
        creators: comicMetaCreators(m),
        image: m.image ?? m.thumbnail ?? "",
        description: m.description ?? undefined,
        createdAt: m.year ? `${m.year}` : undefined,
        metaId: m.id,
      })),
    [metaIssues]
  );

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

  const totalPages = Math.max(1, Math.ceil(metaTotal / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

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
              {t("comics.bazingaComics")}
            </p>
            <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">
              {t("comics.allComicsTitle")}
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              {effectiveQuery
                ? t("comics.matchingSummary", { count: metaTotal.toLocaleString(), query: effectiveQuery })
                : t("comics.catalogSummary", { count: metaTotal.toLocaleString() })}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-8 py-10 md:py-14">
          {/* Local search — mirrors the Series page so every catalog has the same chrome */}
          <div className="flex justify-end mb-6">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder={t("comics.searchPlaceholder")}
                className="w-full h-10 rounded-md bg-card border border-border pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {metaQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-16">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("manga.loading")}
            </div>
          ) : all.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">{t("comics.noneFound")}</p>
              {effectiveQuery && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => {
                    setLocalQuery("");
                    setDebounced("");
                  }}
                >
                  {t("comics.clearFilters")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {all.map((c) => (
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
                {t("comics.previous")}
              </PagerButton>
              <span className="text-sm text-muted-foreground">
                {t("comics.page")} <strong className="text-foreground">{safePage}</strong>{" "}
                {t("comics.of")} {totalPages}
              </span>
              <PagerButton
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                direction="next"
              >
                {t("comics.next")}
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
            metaId: selected.metaId,
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
