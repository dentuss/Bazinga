import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SuperheroesSection from "@/components/SuperheroesSection";

const Characters = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main>
      {/* Page-level hero */}
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
            Bazinga Universe
          </p>
          <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">
            Characters
          </h1>
          <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Heroes, villains and everyone in between — pulled live from every comic multiverse.
          </p>
        </div>
      </section>

      <SuperheroesSection />
    </main>
    <Footer />
  </div>
);

export default Characters;
