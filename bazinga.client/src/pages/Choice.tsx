import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Tv } from "lucide-react";
import comic1 from "@/assets/comic-1.jpg";
import comic2 from "@/assets/comic-2.jpg";
import comic3 from "@/assets/comic-3.jpg";
import comic4 from "@/assets/comic-4.jpg";
import comic5 from "@/assets/comic-5.jpg";
import comic6 from "@/assets/comic-6.jpg";
import heroBanner2 from "@/assets/hero-banner-2.jpg";
import heroBanner3 from "@/assets/hero-banner-3.jpg";

const comicCollage = [comic1, comic2, comic3, comic4, comic5, comic6];

const Choice = () => {
  const { user } = useAuth();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-foreground">
      {/* Top floating brand */}
      <div className="absolute top-0 left-0 right-0 z-30 px-6 py-5 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <Link to="/" className="text-3xl font-black tracking-tighter text-primary">
            BAZINGA
          </Link>
          <p className="mt-1 text-[10px] md:text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
            Choose your experience
          </p>
        </div>
        {user && (
          <p className="text-sm text-white/70 pointer-events-auto hidden md:block">
            Welcome back, <span className="font-semibold text-white">{user.username}</span>
          </p>
        )}
      </div>

      <div className="group/root flex h-full w-full flex-col md:flex-row">
        {/* COMICS HALF */}
        <Link
          to="/comics"
          className="group/comics relative flex-1 overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary transition-[flex-grow] duration-700 ease-out md:hover:flex-[1.6] md:group-hover/root:[&:not(:hover)]:flex-[0.4]"
          aria-label="Enter Bazinga Comics"
        >
          {/* Background: comic cover collage */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 transition-transform duration-700 ease-out group-hover/comics:scale-105">
            {comicCollage.map((src, i) => (
              <div key={i} className="overflow-hidden">
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          {/* Dark overlay (lifted on hover) */}
          <div className="absolute inset-0 bg-black/70 transition-opacity duration-700 group-hover/comics:bg-black/40" />

          {/* Diagonal split edge accent on the right */}
          <div className="hidden md:block absolute top-0 right-0 h-full w-px bg-white/10" />

          {/* Red glow background light effect */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/comics:opacity-100"
            style={{
              background:
                "radial-gradient(circle at center, hsl(0 82% 55% / 0.55) 0%, hsl(0 82% 45% / 0.25) 35%, transparent 70%)",
            }}
          />
          {/* Outer red bloom along edges */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/comics:opacity-100"
            style={{
              boxShadow: "inset 0 0 120px 30px hsl(0 82% 55% / 0.7)",
            }}
          />

          {/* Bottom-up gradient for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
            <div className="flex items-center gap-3 mb-4 transition-transform duration-700 group-hover/comics:-translate-y-2">
              <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-primary drop-shadow-[0_0_12px_hsl(0_82%_55%/0.9)]" />
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-primary">
                Read
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] transition-transform duration-700 group-hover/comics:scale-105">
              BAZINGA
              <span className="block text-primary">COMICS</span>
            </h2>
            <p className="mt-6 text-base md:text-lg text-white/80 max-w-md transition-opacity duration-500 opacity-80 group-hover/comics:opacity-100">
              Dive into thousands of issues — heroes, villains and the legends in between.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 px-8 py-3 border-2 border-primary text-primary font-bold tracking-widest uppercase translate-y-4 opacity-0 transition-all duration-500 group-hover/comics:translate-y-0 group-hover/comics:opacity-100 group-hover/comics:bg-primary group-hover/comics:text-primary-foreground">
              Enter Comics
            </div>
          </div>
        </Link>

        {/* TV HALF */}
        <Link
          to="/bazinga-tv"
          className="group/tv relative flex-1 overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-[flex-grow] duration-700 ease-out md:hover:flex-[1.6] md:group-hover/root:[&:not(:hover)]:flex-[0.4]"
          aria-label="Enter BazingaTV"
        >
          {/* Background: looping video with poster fallback */}
          <video
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/tv:scale-105"
            autoPlay
            loop
            muted
            playsInline
            poster={heroBanner3}
          >
            {/* Place a tv preview clip at /videos/bazinga-tv-preview.mp4 to enable real motion */}
            <source src="/videos/bazinga-tv-preview.mp4" type="video/mp4" />
          </video>

          {/* Animated cinematic backdrop (also visible behind video while it loads) */}
          <div className="absolute inset-0 -z-10">
            <img src={heroBanner2} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,_transparent,_hsl(25_95%_55%/0.18),_transparent_60%)] animate-[spin_18s_linear_infinite]" />
          </div>

          {/* Dark overlay (lifted on hover) */}
          <div className="absolute inset-0 bg-black/70 transition-opacity duration-700 group-hover/tv:bg-black/40" />

          {/* Orange glow background light effect */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/tv:opacity-100"
            style={{
              background:
                "radial-gradient(circle at center, hsl(25 95% 55% / 0.55) 0%, hsl(25 95% 45% / 0.25) 35%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/tv:opacity-100"
            style={{
              boxShadow: "inset 0 0 120px 30px hsl(25 95% 55% / 0.7)",
            }}
          />

          {/* Bottom-up gradient for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
            <div className="flex items-center gap-3 mb-4 transition-transform duration-700 group-hover/tv:-translate-y-2">
              <Tv className="h-8 w-8 md:h-10 md:w-10 text-orange-500 drop-shadow-[0_0_12px_hsl(25_95%_55%/0.9)]" />
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-orange-500">
                Watch
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] transition-transform duration-700 group-hover/tv:scale-105">
              BAZINGA
              <span className="block text-orange-500">TV</span>
            </h2>
            <p className="mt-6 text-base md:text-lg text-white/80 max-w-md transition-opacity duration-500 opacity-80 group-hover/tv:opacity-100">
              Animated series, live action and anime — straight from the Bazinga universe.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 px-8 py-3 border-2 border-orange-500 text-orange-500 font-bold tracking-widest uppercase translate-y-4 opacity-0 transition-all duration-500 group-hover/tv:translate-y-0 group-hover/tv:opacity-100 group-hover/tv:bg-orange-500 group-hover/tv:text-black">
              Enter BazingaTV
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Choice;
