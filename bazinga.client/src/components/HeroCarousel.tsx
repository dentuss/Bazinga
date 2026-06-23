import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBanner1 from "@/assets/hero-banner-1.jpg";
import heroBanner2 from "@/assets/hero-banner-2.jpg";
import heroBanner3 from "@/assets/hero-banner-3.jpg";

const slides = [
  {
    image: heroBanner1,
    title: "YOUR COMPLETE GUIDE TO 'HEROES OF BAZINGA'",
    description: "Discover the epic universe of Bazinga Comics",
  },
  {
    image: heroBanner2,
    title: "THE ULTIMATE SHOWDOWN BEGINS",
    description: "Heroes and villains collide in the battle of the century",
  },
  {
    image: heroBanner3,
    title: "MEET THE LEGENDARY TEAM",
    description: "Join the most powerful heroes in the cosmos",
  },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <section id="hero" className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Background images: each slide layered absolutely, crossfade via opacity */}
      {slides.map((s, index) => (
        <div
          key={index}
          aria-hidden={index !== currentSlide}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          <img
            src={s.image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ))}

      {/* Foreground content lives in a SINGLE column that doesn't move when
         the slide changes — only its text content swaps. Reserving a fixed
         min-height for the title block keeps the CTA button anchored to the
         same baseline so it no longer "jumps" between slides. */}
      <div className="absolute inset-0 z-20 flex items-center pointer-events-none">
        <div className="container mx-auto px-4 pointer-events-auto">
          <div className="max-w-2xl flex flex-col gap-6">
            <div className="min-h-[140px] md:min-h-[200px] flex flex-col justify-end">
              <h1
                key={`title-${currentSlide}`}
                className="text-4xl md:text-6xl font-black leading-tight animate-fade-in"
              >
                {slide.title}
              </h1>
            </div>
            <div className="min-h-[56px] md:min-h-[64px] flex items-start">
              <p
                key={`desc-${currentSlide}`}
                className="text-lg md:text-xl text-muted-foreground animate-fade-in"
              >
                {slide.description}
              </p>
            </div>
            <div>
              <Link to="/news">
                <Button variant="hero" size="lg">
                  {t("hero.readMore")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-background/50 hover:bg-background/80 backdrop-blur p-2 rounded-full transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-background/50 hover:bg-background/80 backdrop-blur p-2 rounded-full transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
