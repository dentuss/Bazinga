import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BookOpen, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchManga, mangaMetaLine, type MangaDto } from "@/lib/metadata";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/contexts/CollectionsContext";

interface MangaModalProps {
  manga: MangaDto;
  onClose: () => void;
}

const MangaModal = ({ manga, onClose }: MangaModalProps) => {
  const { token } = useAuth();
  const { isSaved, toggle } = useCollections();
  const { t } = useTranslation();
  const { data: detail } = useQuery({
    queryKey: ["manga-detail", manga.malId],
    queryFn: () => fetchManga(manga.malId),
    staleTime: 60 * 60 * 1000,
  });
  const full = detail ?? manga;
  const inLibrary = isSaved("library", "manga", String(full.malId));

  const handleLibraryToggle = () =>
    void toggle("library", {
      kind: "manga",
      contentId: String(full.malId),
      title: full.title,
      image: full.largeImageUrl ?? full.imageUrl ?? null,
      subtitle: full.authors.join(", ") || (full.type ?? "Manga"),
      payload: full,
    });

  return (
    <div
      className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-2 sm:my-0 rounded-xl overflow-hidden border border-primary/40 bg-card shadow-[0_0_60px_hsl(0_82%_55%/0.4)] max-h-[calc(100dvh-16px)] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/80 hover:bg-black ring-1 ring-white/20 flex items-center justify-center transition-colors"
          aria-label={t("modal.close")}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="grid sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr] overflow-y-auto">
          <div className="relative bg-black aspect-[16/9] sm:aspect-auto sm:min-h-[280px]">
            <img
              src={full.largeImageUrl ?? full.imageUrl ?? "/placeholder.svg"}
              alt={full.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight pr-12">{full.title}</h2>
              {full.titleEnglish && full.titleEnglish !== full.title && (
                <p className="text-sm text-muted-foreground">{full.titleEnglish}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {full.score ? (
                <span className="font-bold text-primary">★ {full.score.toFixed(2)}</span>
              ) : null}
              {full.rank ? (
                <span className="text-muted-foreground">{t("modal.rank")} #{full.rank}</span>
              ) : null}
              <span className="text-muted-foreground">{mangaMetaLine(full)}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {full.synopsis ?? t("modal.noSynopsis")}
            </p>
            {full.authors.length > 0 && (
              <p className="text-xs">
                <span className="text-muted-foreground mr-1">{t("modal.authors")}:</span>
                {full.authors.join(", ")}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {full.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                >
                  {g}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-[1.03]">
                <BookOpen className="h-4 w-4" /> {t("modal.readNow")}
              </Button>
              {token && (
                <Button
                  variant="outline"
                  onClick={handleLibraryToggle}
                  className={inLibrary ? "border-primary bg-primary/10 text-primary hover:bg-primary/20" : ""}
                >
                  <Heart className={`h-4 w-4 ${inLibrary ? "fill-current text-primary" : ""}`} />
                  {inLibrary ? t("modal.inLibrary") : t("modal.addToLibrary")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangaModal;
