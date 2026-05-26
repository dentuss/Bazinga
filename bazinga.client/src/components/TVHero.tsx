import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrailerModal from "@/components/TrailerModal";
import { trailers } from "@/data/trailers";
import heroBanner1 from "@/assets/hero-banner-1.jpg";
import heroBanner2 from "@/assets/hero-banner-2.jpg";
import heroBanner3 from "@/assets/hero-banner-3.jpg";

const posters = [heroBanner1, heroBanner2, heroBanner3];

const MIN_CLIP_SECONDS = 10;
const MAX_CLIP_SECONDS = 15;

const TVHero = () => {
  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const segmentEndRef = useRef<number>(Number.POSITIVE_INFINITY);

  const current = trailers[index];

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % trailers.length);
  }, []);

  const goTo = useCallback((target: number) => {
    setIndex(((target % trailers.length) + trailers.length) % trailers.length);
  }, []);

  // Pick a random 10–15s window of the clip once metadata is known.
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const clip = MIN_CLIP_SECONDS + Math.random() * (MAX_CLIP_SECONDS - MIN_CLIP_SECONDS);
    const maxStart = Math.max(0, duration - clip - 0.5);
    const start = maxStart > 0 ? Math.random() * maxStart : 0;
    segmentEndRef.current = start + clip;
    try {
      video.currentTime = start;
    } catch {
      /* seeking may fail on some browsers before play; ignored */
    }
    video.play().catch(() => {
      /* autoplay may be blocked; poster remains visible */
    });
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (e.currentTarget.currentTime >= segmentEndRef.current) {
      // Block further advances until the next clip's metadata resets this.
      segmentEndRef.current = Number.POSITIVE_INFINITY;
      advance();
    }
  };

  // Pause the background reel while the trailer modal is open.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (modalOpen) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [modalOpen]);

  return (
    <section className="relative h-[80vh] min-h-[560px] -mt-16 overflow-hidden">
      {/* Background reel (key forces a fresh clip + crossfade per slide) */}
      <div key={current.id} className="absolute inset-0 animate-fade-in">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={current.src}
          poster={posters[index % posters.length]}
          autoPlay
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={advance}
        />
      </div>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, hsl(25 95% 55% / 0.18), transparent 60%)",
        }}
      />

      {/* Foreground content */}
      <div className="relative z-10 container mx-auto h-full px-4 md:px-8 flex items-end pb-16 md:pb-24">
        <div key={current.id} className="max-w-2xl space-y-5 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            {current.badges.map((badge) => (
              <span
                key={badge}
                className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-full px-3 py-1"
              >
                {badge}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] uppercase">
            {current.title}
          </h1>
          <p className="text-lg md:text-xl text-foreground/85 max-w-xl">{current.tagline}</p>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            {current.description}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 font-bold"
              onClick={() => setModalOpen(true)}
            >
              <Play className="h-5 w-5 fill-current" /> Play
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => setModalOpen(true)}
            >
              <Info className="h-5 w-5" /> More Info
            </Button>
          </div>
        </div>
      </div>

      {/* Carousel controls */}
      <button
        type="button"
        onClick={() => goTo(index - 1)}
        className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-14 items-center justify-center text-white/70 hover:text-white bg-gradient-to-r from-background/60 to-transparent opacity-0 hover:opacity-100 transition-opacity"
        aria-label="Previous trailer"
      >
        <ChevronLeft className="h-9 w-9" />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 w-14 items-center justify-center text-white/70 hover:text-white bg-gradient-to-l from-background/60 to-transparent opacity-0 hover:opacity-100 transition-opacity"
        aria-label="Next trailer"
      >
        <ChevronRight className="h-9 w-9" />
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-6 right-6 md:right-8 z-20 flex items-center gap-2">
        {trailers.map((trailer, i) => (
          <button
            key={trailer.id}
            type="button"
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-8 bg-orange-500" : "w-3 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Show ${trailer.title}`}
            aria-current={i === index}
          />
        ))}
      </div>

      {modalOpen && <TrailerModal trailer={current} onClose={() => setModalOpen(false)} />}
    </section>
  );
};

export default TVHero;
