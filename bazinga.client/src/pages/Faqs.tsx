import { useState } from "react";
import { ChevronDown, Mail, MessageCircle, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const categories = [
  {
    title: "Account & billing",
    faqs: [
      {
        q: "Where do I see when my plan renews?",
        a: "Open Account → Subscription. The next charge date sits under your plan name, with the card on file beneath. You can switch plans or cancel from the same panel — changes take effect immediately for upgrades, and at the next renewal for cancellations.",
      },
      {
        q: "Can I share my account?",
        a: "Each account supports up to 5 profiles for people in the same household. Outside the household, each person needs their own subscription. We don't audit IPs aggressively, but we do limit concurrent reads on the same plan.",
      },
      {
        q: "How do I update my payment method?",
        a: "Account → Subscription → Update payment method. We use Stripe for card processing, so card details never touch our servers directly.",
      },
    ],
  },
  {
    title: "Reading on Bazinga",
    faqs: [
      {
        q: "How do I read a comic?",
        a: "Click any cover to open the reader — it's web-based, works on desktop, tablet and phone, and remembers where you left off. There's nothing to download.",
      },
      {
        q: "Can I read offline?",
        a: "On phone and tablet, yes — tap the cloud icon on an issue's page to pin it for offline reading. Pins last 30 days and refresh whenever you reconnect.",
      },
      {
        q: "What resolution are the scans?",
        a: "Most issues are mastered at 3000px on the long edge. The reader serves the appropriate size for your viewport — you don't have to fiddle with quality settings.",
      },
    ],
  },
  {
    title: "BazingaTV",
    faqs: [
      {
        q: "Is BazingaTV included with my plan?",
        a: "Bazinga TV and Bazinga Unlimited both include streaming. Bazinga Comics is reader-only. You can switch tiers at any time from Account → Subscription.",
      },
      {
        q: "What devices can I watch on?",
        a: "Web (Chrome, Safari, Firefox, Edge), iOS, Android, Apple TV, Fire TV, Roku and most modern smart TVs (Samsung 2022+, LG 2021+). HDR and 4K require an Unlimited plan and a supported device.",
      },
    ],
  },
  {
    title: "Profiles & parental controls",
    faqs: [
      {
        q: "How do I add a Kids profile?",
        a: "Account → Profiles → Add profile and toggle the Kids switch. Kids profiles filter the catalog to age-appropriate titles and disable purchases.",
      },
      {
        q: "Can I lock a profile with a PIN?",
        a: "Open Account → Security. Pick the profile and set a 4-digit PIN. The PIN gates entry into that profile and the ability to change its settings.",
      },
    ],
  },
];

const Faqs = () => {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>("0-0");

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter((f) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
      }),
    }))
    .filter((cat) => cat.faqs.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, hsl(0 82% 55% / 0.18), transparent 70%)",
            }}
          />
          <div className="relative container mx-auto px-4 md:px-8 py-14 md:py-20 text-center">
            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-primary">
              Help Centre
            </p>
            <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">
              How can we help?
            </h1>
            <div className="mt-8 max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the help centre…"
                className="pl-12 h-12 text-base"
              />
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-8 py-12 max-w-3xl">
          {filteredCategories.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Nothing matches — try a different phrase or browse the categories below.
            </p>
          ) : (
            <div className="space-y-10">
              {filteredCategories.map((cat, catIdx) => (
                <div key={cat.title}>
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-4">
                    {cat.title}
                  </h2>
                  <div className="space-y-2">
                    {cat.faqs.map((f, idx) => {
                      const key = `${catIdx}-${idx}`;
                      const open = openKey === key;
                      return (
                        <div
                          key={key}
                          className="rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-primary/40"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenKey(open ? null : key)}
                            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
                            aria-expanded={open}
                          >
                            <span>{f.q}</span>
                            <ChevronDown
                              className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                            />
                          </button>
                          <div
                            className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                          >
                            <div className="overflow-hidden">
                              <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                                {f.a}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="container mx-auto px-4 md:px-8 py-14 grid gap-4 md:grid-cols-2 max-w-3xl">
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20">
              <Mail className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-black text-lg">Email us</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Account, billing and content takedowns — we reply within one business day.
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:help@bazinga.local">help@bazinga.local</a>
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20">
              <MessageCircle className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-black text-lg">Open a ticket</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Reader bugs, reading-history sync issues, or "this didn't work" — file a ticket and a
                human will pick it up.
              </p>
              <Button variant="outline" asChild>
                <Link to="/under-construction">New ticket</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Faqs;
