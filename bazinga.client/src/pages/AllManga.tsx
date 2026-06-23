import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MangaUniverse from "@/components/MangaUniverse";

const AllManga = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 70% 30%, hsl(25 95% 55% / 0.22), transparent 65%), radial-gradient(ellipse at 30% 70%, hsl(0 82% 55% / 0.18), transparent 70%)",
            }}
          />
          <div className="relative container mx-auto px-4 md:px-8 py-14 md:py-20 text-center">
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-primary">
              {t("manga.bazingaManga")}
            </p>
            <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">
              {t("manga.allMangaTitle")}
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              {t("manga.catalogSummary")}
            </p>
          </div>
        </section>

        <MangaUniverse />
      </main>
      <Footer />
    </div>
  );
};

export default AllManga;
