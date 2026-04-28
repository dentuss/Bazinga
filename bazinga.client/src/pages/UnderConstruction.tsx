import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const UnderConstruction = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Header />
    <main className="container mx-auto px-4 py-20 flex-1">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Bazinga Studios</p>
        <h1 className="text-4xl md:text-5xl font-black text-foreground">Under Construction</h1>
        <p className="text-muted-foreground text-lg">
          We are building this experience right now. Check back soon for more adventures in the Bazinga universe.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/">
            <Button size="lg">Return Home</Button>
          </Link>
          <Link to="/news">
            <Button size="lg" variant="outline">
              Visit News
            </Button>
          </Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default UnderConstruction;
