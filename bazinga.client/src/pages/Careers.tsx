import { ArrowRight, Code2, Coffee, Globe, MapPin, Palette, Pencil, Tv, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const teams = [
  {
    icon: Code2,
    name: "Engineering",
    body: "We build the reader, the streaming pipeline and the tooling our editors live in.",
  },
  {
    icon: Palette,
    name: "Design",
    body: "From the reader UI to the marketing site — typography, motion, accessibility.",
  },
  {
    icon: Pencil,
    name: "Editorial",
    body: "Story development, scripts, lettering, art direction. We back creators end-to-end.",
  },
  {
    icon: Tv,
    name: "BazingaTV",
    body: "Streaming engineering, encoding, content acquisition and originals production.",
  },
];

const openings = [
  {
    role: "Senior Reader Engineer",
    team: "Engineering",
    location: "Lisbon / Remote (EU)",
    type: "Full-time",
  },
  {
    role: "Comic Lettering Lead",
    team: "Editorial",
    location: "Tokyo",
    type: "Full-time",
  },
  {
    role: "Streaming Reliability SRE",
    team: "BazingaTV",
    location: "Brooklyn",
    type: "Full-time",
  },
  {
    role: "Brand Designer",
    team: "Design",
    location: "Lisbon / Hybrid",
    type: "Full-time",
  },
  {
    role: "Editor, Originals",
    team: "Editorial",
    location: "Lagos",
    type: "Full-time",
  },
  {
    role: "Frontend Engineer, Discovery",
    team: "Engineering",
    location: "Remote (Worldwide)",
    type: "Contract → Full-time",
  },
];

const benefits = [
  { icon: Globe, text: "Hybrid by default — work where you read best." },
  { icon: Coffee, text: "Four weeks paid leave + your local bank holidays." },
  { icon: Users, text: "Equity in everything we ship." },
];

const Careers = () => (
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
            Careers
          </p>
          <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] max-w-3xl mx-auto">
            Help us build the best shelf on the internet.
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            We're hiring readers, writers, makers and engineers across four offices and three
            time zones.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-14 md:py-20">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-6">Teams</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {teams.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.name}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20"
              >
                <Icon className="h-6 w-6 text-primary mb-3 transition-transform group-hover:scale-110" />
                <h3 className="font-black text-lg">{t.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container mx-auto px-4 md:px-8 py-14 md:py-20">
          <div className="flex items-end justify-between gap-3 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                Open roles
              </p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1">
                {openings.length} positions
              </h2>
            </div>
            <Link to="/internships" className="text-sm text-primary font-semibold hover:underline">
              Looking for an internship?
            </Link>
          </div>
          <div className="space-y-2 max-w-4xl">
            {openings.map((o) => (
              <Link
                key={o.role}
                to="/under-construction"
                className="group flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4 transition-all hover:border-primary/60 hover:translate-x-1"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-black truncate group-hover:text-primary transition-colors">
                    {o.role}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{o.team}</p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <MapPin className="h-3.5 w-3.5" />
                  {o.location}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary border border-primary/40 rounded-full px-2 py-0.5 shrink-0">
                  {o.type}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-14 md:py-20 max-w-3xl">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-4">
          Why Bazinga
        </h2>
        <ul className="space-y-3">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <li key={b.text} className="flex items-start gap-3 text-sm">
                <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>{b.text}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-10 flex items-center gap-3">
          <Button asChild>
            <a href="mailto:hiring@bazinga.local">hiring@bazinga.local</a>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/about-bazinga">About Bazinga</Link>
          </Button>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Careers;
