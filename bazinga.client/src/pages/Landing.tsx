import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Loader2, Play, Bookmark, Smartphone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { checkSignupEmail } from "@/lib/signup";
import heroBanner from "@/assets/hero-banner-1.jpg";
import comic1 from "@/assets/comic-1.jpg";
import comic2 from "@/assets/comic-2.jpg";
import comic3 from "@/assets/comic-3.jpg";
import comic4 from "@/assets/comic-4.jpg";
import comic5 from "@/assets/comic-5.jpg";
import comic6 from "@/assets/comic-6.jpg";
import comic7 from "@/assets/comic-7.jpg";
import comic8 from "@/assets/comic-8.jpg";

const trending = [
  { image: comic1, title: "Heroes of Bazinga" },
  { image: comic2, title: "Cosmic Showdown" },
  { image: comic3, title: "Shadow Legion" },
  { image: comic4, title: "Neon Knights" },
  { image: comic5, title: "Eternal Sentinels" },
  { image: comic6, title: "Rogue Galaxy" },
  { image: comic7, title: "Dark Horizon" },
  { image: comic8, title: "Crimson Empire" },
];

const reasons = [
  {
    icon: Play,
    title: "Stream on any screen",
    description: "Watch shows and anime on your TV, laptop, tablet or phone.",
  },
  {
    icon: Bookmark,
    title: "Endless comics catalog",
    description: "Thousands of issues at your fingertips. New drops every week.",
  },
  {
    icon: Download,
    title: "Download to enjoy offline",
    description: "Save comics and episodes for plane rides, commutes and beyond.",
  },
  {
    icon: Smartphone,
    title: "One subscription, two universes",
    description: "Comics and BazingaTV under a single Bazinga account.",
  },
];

const faqs = [
  {
    q: "What is Bazinga?",
    a: "Bazinga is a streaming home for comics and original shows. Read thousands of digital comics and watch animated adaptations, live action series and anime — all from one account.",
  },
  {
    q: "How much does Bazinga cost?",
    a: "Browse our catalog for free. Bazinga Premium starts at $4.99/month with discounts on physical and digital comics. Bazinga Unlimited at $14.99/month unlocks unlimited digital reading and BazingaTV.",
  },
  {
    q: "Where can I read and watch?",
    a: "Read comics and watch BazingaTV on the web, on iOS and Android, and on supported smart TVs. Pick up exactly where you left off across devices.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no contracts and no cancellation fees. Cancel your subscription with two clicks from your account settings.",
  },
];

const Landing = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const heroFormRef = useRef<HTMLFormElement | null>(null);

  const handleSignupStart = async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setCheckingEmail(true);
    try {
      const { available } = await checkSignupEmail(trimmed);
      if (available) {
        navigate(`/signup/review?email=${encodeURIComponent(trimmed)}`);
      } else {
        toast({
          title: "You already have a Bazinga account",
          description: "We'll take you to sign in.",
        });
        navigate(`/auth?mode=signin&email=${encodeURIComponent(trimmed)}`);
      }
    } catch (err) {
      toast({
        title: "Could not check that email",
        description: err instanceof Error ? err.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setCheckingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(0_82%_55%_/_0.18),_transparent_70%)]" />
        </div>

        {/* Top nav */}
        <header className="relative z-20">
          <div className="container mx-auto flex items-center justify-between px-4 py-6">
            <Link to="/" className="text-3xl font-black tracking-tighter text-primary">
              BAZINGA
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/auth?mode=signin">
                <Button variant="default" size="lg" className="font-bold">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 container mx-auto px-4 pt-20 pb-32 md:pt-32 md:pb-48 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            Unlimited comics, shows and more.
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-foreground/90 max-w-2xl mx-auto">
            Read. Watch. Belong to the Bazinga universe.
          </p>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Ready to dive in? Create an account or sign in to get started.
          </p>
          <form
            ref={heroFormRef}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto justify-center"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void handleSignupStart(String(data.get("email") || ""));
            }}
          >
            <Input
              type="email"
              name="email"
              required
              placeholder="Email address"
              className="h-14 text-base bg-background/70 border-border/80 backdrop-blur"
              disabled={checkingEmail}
            />
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="h-14 px-8 text-base"
              disabled={checkingEmail}
            >
              {checkingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking…
                </>
              ) : (
                "Get Started"
              )}
            </Button>
          </form>
        </div>

        {/* Decorative bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* Trending */}
      <section className="py-16 md:py-20 border-t border-border/60">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black mb-8">Trending now</h2>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
              {trending.map((item, idx) => (
                <div
                  key={item.title}
                  className="relative shrink-0 w-44 md:w-52 snap-start group cursor-pointer"
                >
                  <div className="absolute -left-3 top-2 text-7xl md:text-8xl font-black text-primary/80 leading-none select-none pointer-events-none">
                    {idx + 1}
                  </div>
                  <div className="relative ml-10 overflow-hidden rounded-md shadow-xl transition-transform duration-300 group-hover:-translate-y-1">
                    <img src={item.image} alt={item.title} className="w-full aspect-[2/3] object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 text-xs font-bold uppercase tracking-wide text-white">
                      {item.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reasons to join */}
      <section className="py-16 md:py-20 border-t border-border/60 bg-card/40">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black mb-10">More reasons to join</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r) => (
              <div
                key={r.title}
                className="rounded-xl border border-border/60 bg-gradient-to-br from-card to-background p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-[0_0_30px_hsl(var(--shadow-glow))]"
              >
                <r.icon className="h-10 w-10 text-primary" />
                <h3 className="mt-4 text-xl font-bold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black mb-10 text-center">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((f, idx) => (
              <div key={f.q} className="border border-border/60 bg-card rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-5 text-left text-lg font-semibold hover:bg-card/70 transition-colors"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${openFaq === idx ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">Ready to join the Bazinga universe?</p>
            <Button
              variant="hero"
              size="lg"
              className="h-14 px-10 text-base"
              onClick={() => {
                heroFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                const input = heroFormRef.current?.querySelector<HTMLInputElement>("input[name=email]");
                input?.focus();
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>©2025 BAZINGA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
