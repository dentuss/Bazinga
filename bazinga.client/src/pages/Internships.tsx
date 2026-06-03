import { ArrowRight, Briefcase, Calendar, GraduationCap, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tracks = [
  {
    title: "Editorial Fellowship",
    duration: "12 weeks · Summer",
    location: "Tokyo / Brooklyn",
    body:
      "Sit inside an editorial team for a season. Read submissions, assist on an issue from script to letter, and walk away with a credited masthead line.",
  },
  {
    title: "Engineering Internship",
    duration: "12 weeks · Year-round",
    location: "Lisbon / Remote (EU)",
    body:
      "Ship to the reader, the streaming player or our internal tools. Pair with a senior engineer, own one production change end-to-end, and present it at the all-hands.",
  },
  {
    title: "Design Studio Residency",
    duration: "10 weeks · Twice yearly",
    location: "Lisbon",
    body:
      "Work alongside the Bazinga design studio on identity, illustration and motion. Open to recent grads from any visual discipline.",
  },
  {
    title: "BazingaTV Production Intern",
    duration: "16 weeks · Fall",
    location: "Brooklyn",
    body:
      "Support an originals team from greenlight to post. Best for students with a film, animation or production background.",
  },
];

const Internships = () => (
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
            Internships
          </p>
          <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] max-w-3xl mx-auto">
            Start your career inside the multiverse.
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Paid internships and fellowships across editorial, engineering, design and BazingaTV.
            Applications open four months before each cohort.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-14 md:py-20">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-6">
          Tracks
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {tracks.map((t) => (
            <div
              key={t.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20"
            >
              <Briefcase className="h-6 w-6 text-primary mb-3 transition-transform group-hover:scale-110" />
              <h3 className="text-xl font-black">{t.title}</h3>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {t.duration}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {t.location}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container mx-auto px-4 md:px-8 py-14 md:py-20 max-w-3xl text-center">
          <GraduationCap className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-black">Who can apply?</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed">
            We accept students currently enrolled at any institution and recent grads within 18
            months of their degree. Bazinga internships are paid, with a relocation stipend for
            on-site cohorts. Visa sponsorship is available for the Tokyo, Brooklyn and Lisbon
            tracks.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild>
              <a href="mailto:internships@bazinga.local">internships@bazinga.local</a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/careers">
                See open roles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Internships;
