import { BookOpen, Sparkles, Tv, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const pillars = [
  {
    icon: BookOpen,
    title: "Comics for the way you actually read",
    body:
      "Every issue on Bazinga is read on-site — no downloads, no compatibility quirks. We tune the reader to keep colour and lettering exactly how the team drew it.",
  },
  {
    icon: Tv,
    title: "One pass, two universes",
    body:
      "BazingaTV streams the animated series, live-action and anime that share a shelf with our comics — written by the same writers, on the same cosmology.",
  },
  {
    icon: Users,
    title: "Built around creators",
    body:
      "Royalties land on time, every time. Our editorial program backs new voices with paid pitch development and a guaranteed three-issue run.",
  },
  {
    icon: Sparkles,
    title: "No ads. Ever.",
    body:
      "Subscriptions pay for the work. You'll never see an interstitial mid-issue or a paid placement inside a panel.",
  },
];

const numbers = [
  { value: "42M", label: "Issues read every month" },
  { value: "2,300+", label: "Series in the catalog" },
  { value: "180", label: "Countries served" },
  { value: "$14M", label: "Paid to creators in 2025" },
];

const AboutBazinga = () => (
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
        <div className="relative container mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-primary">
            About Bazinga
          </p>
          <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] max-w-3xl mx-auto">
            A reading shelf and a streaming queue, finally in one place.
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            We started Bazinga because the comic you love and the show it inspired shouldn't live
            in two different apps with two different bills. So we put them under one roof.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20"
              >
                <div className="h-10 w-10 rounded-md bg-primary/10 text-primary grid place-items-center mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black mb-2">{p.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="container mx-auto px-4 md:px-8 py-14 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {numbers.map((n) => (
              <div key={n.label} className="text-center">
                <p className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                  {n.value}
                </p>
                <p className="mt-2 text-xs md:text-sm uppercase tracking-wider text-muted-foreground">
                  {n.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-14 md:py-20 max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-black mb-6">The Bazinga story</h2>
        <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
          <p>
            Bazinga began in a rented warehouse in 2019, with a handful of comic writers who were
            tired of selling stories one platform at a time. The pitch was simple: a reader-first
            shelf that pays creators on time and lives next door to the screens those stories
            eventually find.
          </p>
          <p>
            Six years on we publish, license and stream — but the brief hasn't changed. Every
            feature ships with one question on the wall: <em>does it make reading or watching
            better?</em> If the answer's no, we cut it.
          </p>
          <p>
            We're headquartered in Lisbon with editorial offices in Tokyo, Brooklyn and Lagos. If
            you want to say hi, work with us, or pitch us a series, find us in <a href="/careers" className="text-primary underline-offset-4 hover:underline">Careers</a> or drop a line through the <a href="/faqs" className="text-primary underline-offset-4 hover:underline">help centre</a>.
          </p>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default AboutBazinga;
