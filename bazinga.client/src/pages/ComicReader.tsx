import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { resolveImageUrl } from "@/lib/images";

interface ComicDto {
  id: number;
  title: string;
  image: string;
  author?: string;
}

const ComicReader = () => {
  const { id } = useParams();
  const { data: comics = [] } = useQuery<ComicDto[]>({
    queryKey: ["comics"],
    queryFn: () => apiFetch<ComicDto[]>("/api/comics"),
  });

  const comic = useMemo(() => comics.find((item) => String(item.id) === String(id)), [comics, id]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Digital Read</p>
              <h1 className="text-3xl md:text-4xl font-black text-foreground">
                {comic?.title ?? "Bazinga Comic Issue"}
              </h1>
              <p className="text-sm text-muted-foreground">{comic?.author ?? "Bazinga Studios"}</p>
            </div>
            <Link to="/library">
              <Button variant="outline">Back to library</Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border-[6px] border-foreground bg-white text-black shadow-[6px_6px_0_0_rgba(0,0,0,0.35)]">
                <div className="border-b-4 border-foreground px-6 py-4">
                  <p className="text-sm font-bold uppercase tracking-[0.2em]">Page 1</p>
                </div>
                <div className="grid gap-4 p-6">
                  <div className="rounded-xl border-4 border-foreground bg-gradient-to-br from-yellow-200 via-white to-blue-100 p-6">
                    <p className="text-lg font-semibold uppercase tracking-wide">Lorem Ipsum</p>
                    <p className="mt-3 text-sm leading-relaxed">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum
                      vestibulum. Cras venenatis euismod malesuada. In hac habitasse platea dictumst.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border-4 border-foreground bg-white p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-600">Panel</p>
                      <p className="mt-2 text-sm leading-relaxed">
                        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
                        laudantium, totam rem aperiam.
                      </p>
                    </div>
                    <div className="rounded-xl border-4 border-foreground bg-white p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Panel</p>
                      <p className="mt-2 text-sm leading-relaxed">
                        Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
                        consequuntur magni dolores eos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-[6px] border-foreground bg-white text-black shadow-[6px_6px_0_0_rgba(0,0,0,0.35)]">
                <div className="border-b-4 border-foreground px-6 py-4">
                  <p className="text-sm font-bold uppercase tracking-[0.2em]">Page 2</p>
                </div>
                <div className="grid gap-4 p-6">
                  <div className="rounded-xl border-4 border-foreground bg-gradient-to-br from-pink-200 via-white to-purple-100 p-6">
                    <p className="text-lg font-semibold uppercase tracking-wide">Dolor Sit Amet</p>
                    <p className="mt-3 text-sm leading-relaxed">
                      Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi
                      ut aliquid ex ea commodi consequatur.
                    </p>
                  </div>
                  <div className="rounded-xl border-4 border-foreground bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Panel</p>
                    <p className="mt-2 text-sm leading-relaxed">
                      Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae
                      consequatur, vel illum qui dolorem.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border-[6px] border-foreground bg-white text-black p-6 shadow-[6px_6px_0_0_rgba(0,0,0,0.35)]">
                <h2 className="text-xl font-black uppercase tracking-wide">Speech Bubbles</h2>
                <div className="mt-4 space-y-4">
                  <div className="relative rounded-3xl border-4 border-foreground bg-yellow-100 p-4 text-sm font-semibold">
                    "Lorem ipsum dolor sit amet!"
                    <span className="absolute -bottom-3 left-6 h-4 w-4 rotate-45 border-b-4 border-l-4 border-foreground bg-yellow-100" />
                  </div>
                  <div className="relative rounded-3xl border-4 border-foreground bg-blue-100 p-4 text-sm font-semibold">
                    "Consectetur adipiscing elit!"
                    <span className="absolute -bottom-3 right-8 h-4 w-4 rotate-45 border-b-4 border-r-4 border-foreground bg-blue-100" />
                  </div>
                  <div className="relative rounded-3xl border-4 border-foreground bg-pink-100 p-4 text-sm font-semibold">
                    "Sed do eiusmod tempor incididunt!"
                    <span className="absolute -bottom-3 left-10 h-4 w-4 rotate-45 border-b-4 border-l-4 border-foreground bg-pink-100" />
                  </div>
                </div>
              </div>

              {comic?.image && (
                <div className="rounded-2xl border-[6px] border-foreground bg-white text-black p-4 shadow-[6px_6px_0_0_rgba(0,0,0,0.35)]">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Cover art</p>
                  <img
                    src={resolveImageUrl(comic.image)}
                    alt={comic.title}
                    className="mt-3 w-full rounded-lg border-4 border-foreground object-cover"
                  />
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ComicReader;
