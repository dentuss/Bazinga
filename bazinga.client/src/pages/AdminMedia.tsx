import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save, Star, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";
import type { MediaItem, MediaKind } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";

// ---------------------------------------------------------------------------
// Admin media console — list + create/edit forms backed by /api/admin/media.
// Gated by role=ADMIN (the same gate the existing /admin uses).
// Routes:
//   /admin/media               list
//   /admin/media/new           create
//   /admin/media/:id/edit      edit
// ---------------------------------------------------------------------------

type Season = {
  number: number;
  title: string;
  sortOrder: number;
  episodes: Episode[];
};

type Episode = {
  number: number;
  title: string;
  description: string;
  runtimeMinutes: string; // string so the input can hold a blank
  videoUrl: string;
  thumbnail: string;
};

const KIND_OPTIONS: { value: MediaKind; label: string; hint: string }[] = [
  { value: "trailer", label: "Trailer", hint: "Short promo only; no seasons or episodes." },
  { value: "movie",   label: "Movie",   hint: "One playable file; no season picker." },
  { value: "show",    label: "Series",  hint: "Multi-episode TV / live-action series." },
  { value: "anime",   label: "Anime",   hint: "Multi-episode anime; shows up in the Anime rail." },
];

const blankEpisode = (n: number): Episode => ({
  number: n,
  title: "",
  description: "",
  runtimeMinutes: "",
  videoUrl: "",
  thumbnail: "",
});

const blankSeason = (n: number): Season => ({
  number: n,
  title: "",
  sortOrder: 0,
  episodes: [blankEpisode(1)],
});

const isMultiSeason = (k: MediaKind) => k === "show" || k === "anime";

const AdminShell = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Same gate the existing /admin uses; we duplicate it here so /admin/media
  // is independently safe to deep-link.
  if (!user) return <Navigate to="/auth?from=admin" replace />;
  const isAdmin = (user.role ?? "").toUpperCase() === "ADMIN";
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-16 flex-1">
          <Card className="max-w-2xl mx-auto border-destructive/40">
            <CardHeader>
              <CardTitle>Access denied</CardTitle>
              <CardDescription>Only ADMIN users can manage media.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate("/")}>Return home</Button>
              <Button onClick={() => navigate("/auth")}>Switch account</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-6xl mx-auto space-y-8">
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">Comics + Users</Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/admin/media" className="text-primary font-semibold">Media</Link>
          </nav>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ---------------------------------------------------------------------------
// List page
// ---------------------------------------------------------------------------

export const AdminMediaList = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const items = useQuery({
    queryKey: ["admin-media", "list"],
    queryFn: () =>
      apiFetch<MediaItem[]>("/api/admin/media", {
        authToken: token ?? undefined,
      }),
    enabled: !!token,
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/admin/media/${id}`, {
        method: "DELETE",
        authToken: token ?? undefined,
      }),
    onSuccess: () => {
      toast({ title: "Deleted" });
      void qc.invalidateQueries({ queryKey: ["admin-media"] });
      void qc.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (err: unknown) => {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <AdminShell>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-primary font-semibold tracking-wide uppercase">Admin console</p>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mt-2">Media catalogue</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Series, anime, movies and trailers shown across BazingaTV. Newly added items appear at
            the top of their respective rails automatically.
          </p>
        </div>
        <Link to="/admin/media/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add new
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All items</CardTitle>
          <CardDescription>
            {items.data?.length ?? 0} item{(items.data?.length ?? 0) === 1 ? "" : "s"} ·
            sort order ascending, ties broken by newest first
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.isLoading ? (
            <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </p>
          ) : !items.data || items.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No media yet. Click <strong>Add new</strong> to seed the catalogue.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.data.map((m) => (
                <li key={m.id} className="flex items-center gap-4 py-3">
                  <div className="h-14 w-10 rounded bg-muted overflow-hidden shrink-0">
                    {m.posterImage ? (
                      <img src={m.posterImage} alt={m.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold flex items-center gap-2">
                      {m.title}
                      {m.isFeatured && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-orange-500">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.kind} · slug: <code className="text-foreground/80">{m.slug}</code>
                    </p>
                  </div>
                  <Link to={`/admin/media/${m.id}/edit`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (confirm(`Delete "${m.title}"? This can't be undone.`)) {
                        remove.mutate(m.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
};

// ---------------------------------------------------------------------------
// Create / edit form
// ---------------------------------------------------------------------------

interface UpsertPayload {
  slug?: string;
  kind: MediaKind;
  title: string;
  tagline?: string;
  description?: string;
  year?: number | null;
  rating?: string;
  genres?: string[];
  badges?: string[];
  backdropImage?: string;
  posterImage?: string;
  trailerUrl?: string;
  isFeatured: boolean;
  sortOrder: number;
  seasons?: {
    number: number;
    title?: string;
    sortOrder: number;
    episodes: {
      number: number;
      title: string;
      description?: string;
      runtimeMinutes?: number | null;
      videoUrl: string;
      thumbnail?: string;
    }[];
  }[];
}

export const AdminMediaForm = () => {
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const isEdit = editingId !== null;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { token } = useAuth();

  // ---- Form state ---------------------------------------------------------
  const [kind, setKind] = useState<MediaKind>((searchParams.get("kind") as MediaKind) ?? "show");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");
  const [genres, setGenres] = useState(""); // comma-separated for the form
  const [badges, setBadges] = useState("");
  const [backdropImage, setBackdropImage] = useState("");
  const [posterImage, setPosterImage] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState("0");
  const [seasons, setSeasons] = useState<Season[]>([blankSeason(1)]);
  // For movies the form collapses to a single video field so admins don't
  // have to think about seasons. We keep one synthetic season+episode in state
  // so the API payload shape stays consistent.
  const [movieVideoUrl, setMovieVideoUrl] = useState("");
  const [movieRuntime, setMovieRuntime] = useState("");

  // ---- Load existing on edit ----------------------------------------------
  const existing = useQuery({
    queryKey: ["admin-media", "detail", editingId],
    queryFn: () =>
      apiFetch<MediaItem>(`/api/admin/media/${editingId}`, {
        authToken: token ?? undefined,
      }),
    enabled: isEdit && !!token,
  });

  useEffect(() => {
    const data = existing.data;
    if (!data) return;
    setKind(data.kind);
    setTitle(data.title);
    setSlug(data.slug);
    setTagline(data.tagline ?? "");
    setDescription(data.description ?? "");
    setYear(data.year != null ? String(data.year) : "");
    setRating(data.rating ?? "");
    setGenres(data.genres.join(", "));
    setBadges(data.badges.join(", "));
    setBackdropImage(data.backdropImage ?? "");
    setPosterImage(data.posterImage ?? "");
    setTrailerUrl(data.trailerUrl ?? "");
    setIsFeatured(data.isFeatured);
    setSortOrder(String(data.sortOrder));
    if (data.kind === "movie" && data.seasons[0]?.episodes[0]) {
      const ep = data.seasons[0].episodes[0];
      setMovieVideoUrl(ep.videoUrl);
      setMovieRuntime(ep.runtimeMinutes != null ? String(ep.runtimeMinutes) : "");
      setSeasons([blankSeason(1)]); // keep the multi-season slot empty when in movie mode
    } else if (data.seasons.length > 0) {
      setSeasons(
        data.seasons.map((s) => ({
          number: s.number,
          title: s.title ?? "",
          sortOrder: s.sortOrder,
          episodes:
            s.episodes.length > 0
              ? s.episodes.map((e) => ({
                  number: e.number,
                  title: e.title,
                  description: e.description ?? "",
                  runtimeMinutes: e.runtimeMinutes != null ? String(e.runtimeMinutes) : "",
                  videoUrl: e.videoUrl,
                  thumbnail: e.thumbnail ?? "",
                }))
              : [blankEpisode(1)],
        }))
      );
    }
  }, [existing.data]);

  // ---- Submit -------------------------------------------------------------
  const buildPayload = (): UpsertPayload => {
    const base: UpsertPayload = {
      slug: slug.trim() || undefined,
      kind,
      title: title.trim(),
      tagline: tagline.trim() || undefined,
      description: description.trim() || undefined,
      year: year ? Number(year) : null,
      rating: rating.trim() || undefined,
      genres: genres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      badges: badges
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      backdropImage: backdropImage.trim() || undefined,
      posterImage: posterImage.trim() || undefined,
      trailerUrl: trailerUrl.trim() || undefined,
      isFeatured,
      sortOrder: Number(sortOrder || 0),
    };

    if (kind === "trailer") {
      base.seasons = []; // trailers play TrailerUrl, no episode rows needed
    } else if (kind === "movie") {
      base.seasons = [
        {
          number: 1,
          title: undefined,
          sortOrder: 0,
          episodes: [
            {
              number: 1,
              title: title.trim() || "Movie",
              description: description.trim() || undefined,
              runtimeMinutes: movieRuntime ? Number(movieRuntime) : null,
              videoUrl: movieVideoUrl.trim(),
              thumbnail: backdropImage.trim() || undefined,
            },
          ],
        },
      ];
    } else {
      base.seasons = seasons.map((s) => ({
        number: s.number,
        title: s.title.trim() || undefined,
        sortOrder: s.sortOrder,
        episodes: s.episodes
          .filter((e) => e.videoUrl.trim().length > 0)
          .map((e) => ({
            number: e.number,
            title: e.title.trim() || `Episode ${e.number}`,
            description: e.description.trim() || undefined,
            runtimeMinutes: e.runtimeMinutes ? Number(e.runtimeMinutes) : null,
            videoUrl: e.videoUrl.trim(),
            thumbnail: e.thumbnail.trim() || undefined,
          })),
      }));
    }
    return base;
  };

  const save = useMutation({
    mutationFn: (payload: UpsertPayload) =>
      apiFetch<MediaItem>(
        isEdit ? `/api/admin/media/${editingId}` : "/api/admin/media",
        {
          method: isEdit ? "PUT" : "POST",
          authToken: token ?? undefined,
          body: JSON.stringify(payload),
        }
      ),
    onSuccess: () => {
      toast({ title: isEdit ? "Updated" : "Created" });
      void qc.invalidateQueries({ queryKey: ["admin-media"] });
      void qc.invalidateQueries({ queryKey: ["media"] });
      navigate("/admin/media");
    },
    onError: (err: unknown) => {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (kind === "movie" && !movieVideoUrl.trim()) {
      toast({ title: "Movie video URL is required", variant: "destructive" });
      return;
    }
    if (isMultiSeason(kind)) {
      const hasAny = seasons.some((s) => s.episodes.some((e) => e.videoUrl.trim()));
      if (!hasAny) {
        toast({
          title: "Add at least one episode with a video URL",
          variant: "destructive",
        });
        return;
      }
    }
    save.mutate(buildPayload());
  };

  // ---- Season + episode helpers ------------------------------------------
  const addSeason = () =>
    setSeasons((arr) => [...arr, blankSeason((arr[arr.length - 1]?.number ?? 0) + 1)]);

  const removeSeason = (idx: number) =>
    setSeasons((arr) => arr.filter((_, i) => i !== idx));

  const patchSeason = (idx: number, patch: Partial<Season>) =>
    setSeasons((arr) => arr.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const addEpisode = (sIdx: number) =>
    setSeasons((arr) =>
      arr.map((s, i) => {
        if (i !== sIdx) return s;
        const nextN = (s.episodes[s.episodes.length - 1]?.number ?? 0) + 1;
        return { ...s, episodes: [...s.episodes, blankEpisode(nextN)] };
      })
    );

  const removeEpisode = (sIdx: number, eIdx: number) =>
    setSeasons((arr) =>
      arr.map((s, i) => (i === sIdx ? { ...s, episodes: s.episodes.filter((_, j) => j !== eIdx) } : s))
    );

  const patchEpisode = (sIdx: number, eIdx: number, patch: Partial<Episode>) =>
    setSeasons((arr) =>
      arr.map((s, i) =>
        i === sIdx
          ? { ...s, episodes: s.episodes.map((e, j) => (j === eIdx ? { ...e, ...patch } : e)) }
          : s
      )
    );

  // ---- Render -------------------------------------------------------------
  const kindMeta = useMemo(() => KIND_OPTIONS.find((k) => k.value === kind)!, [kind]);

  return (
    <AdminShell>
      <div>
        <p className="text-sm text-primary font-semibold tracking-wide uppercase">Admin console</p>
        <h1 className="text-3xl md:text-4xl font-black text-foreground mt-2">
          {isEdit ? "Edit media" : "Add media"}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Video files live at an external <strong>S3 / CloudFront / CDN URL</strong> — paste the
          link in the Video URL field. Nothing is stored in the repo's <code>public/</code> folder.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- Kind picker -------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Kind</CardTitle>
            <CardDescription>Pick what you're adding — the form adapts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {KIND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKind(opt.value)}
                  className={`text-left rounded-lg border-2 p-4 transition-colors ${
                    kind === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  <p className="font-bold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.hint}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Currently editing as: <strong>{kindMeta.label}</strong>.
              {isEdit && " Changing the kind will rewrite the seasons/episodes section on save."}
            </p>
          </CardContent>
        </Card>

        {/* --- Common fields ----------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>What shows on cards, the hero and the detail modal.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug <span className="text-muted-foreground text-xs">(leave blank to auto-generate from title)</span></Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="berserk" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Brand of sacrifice." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Rating <span className="text-muted-foreground text-xs">(TV-MA, PG-13…)</span></Label>
              <Input id="rating" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="TV-MA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genres">Genres <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
              <Input id="genres" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Action, Dark Fantasy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badges">Badges <span className="text-muted-foreground text-xs">(comma-separated, hero-only)</span></Label>
              <Input id="badges" value={badges} onChange={(e) => setBadges(e.target.value)} placeholder="FINAL SEASON, TOP 10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="posterImage">Poster URL <span className="text-muted-foreground text-xs">(2:3 portrait, rail card)</span></Label>
              <Input id="posterImage" value={posterImage} onChange={(e) => setPosterImage(e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="backdropImage">Backdrop URL <span className="text-muted-foreground text-xs">(wide hero / modal)</span></Label>
              <Input id="backdropImage" value={backdropImage} onChange={(e) => setBackdropImage(e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="trailerUrl">Trailer video URL <span className="text-muted-foreground text-xs">(short clip for the hero / modal preview)</span></Label>
              <Input id="trailerUrl" value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="https://your-bucket.s3.amazonaws.com/berserk-trailer.mp4" />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} id="isFeatured" />
              <Label htmlFor="isFeatured">Show on the TV hero (featured rotation)</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort order <span className="text-muted-foreground text-xs">(lower = first; ties broken by newest)</span></Label>
              <Input id="sortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* --- Kind-specific section --------------------------------------- */}
        {kind === "movie" && (
          <Card>
            <CardHeader>
              <CardTitle>Movie file</CardTitle>
              <CardDescription>One video URL is enough — there are no seasons or episodes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-[1fr_140px]">
              <div className="space-y-2">
                <Label htmlFor="movieVideoUrl">Video URL (S3 link)</Label>
                <Input id="movieVideoUrl" value={movieVideoUrl} onChange={(e) => setMovieVideoUrl(e.target.value)} placeholder="https://your-bucket.s3.amazonaws.com/demon-slayer-infinity-castle.mp4" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="movieRuntime">Runtime (min)</Label>
                <Input id="movieRuntime" type="number" value={movieRuntime} onChange={(e) => setMovieRuntime(e.target.value)} placeholder="155" />
              </div>
            </CardContent>
          </Card>
        )}

        {isMultiSeason(kind) && (
          <Card>
            <CardHeader>
              <CardTitle>Seasons + episodes</CardTitle>
              <CardDescription>
                Each episode needs its own S3 video URL. Empty episode rows are dropped on save.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {seasons.map((season, sIdx) => (
                <div key={sIdx} className="rounded-lg border border-border bg-card/40 p-4 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="space-y-1">
                      <Label className="text-xs">Season number</Label>
                      <Input
                        type="number"
                        value={season.number}
                        onChange={(e) => patchSeason(sIdx, { number: Number(e.target.value || 0) })}
                        className="w-24"
                      />
                    </div>
                    <div className="space-y-1 flex-1 min-w-[200px]">
                      <Label className="text-xs">Season title (optional)</Label>
                      <Input
                        value={season.title}
                        onChange={(e) => patchSeason(sIdx, { title: e.target.value })}
                        placeholder="Golden Age Arc"
                      />
                    </div>
                    {seasons.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSeason(sIdx)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove season
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {season.episodes.map((ep, eIdx) => (
                      <div key={eIdx} className="rounded-md border border-border/60 bg-background/40 p-3 grid gap-3 md:grid-cols-[80px_1fr_140px_60px]">
                        <div className="space-y-1">
                          <Label className="text-xs">Ep #</Label>
                          <Input
                            type="number"
                            value={ep.number}
                            onChange={(e) => patchEpisode(sIdx, eIdx, { number: Number(e.target.value || 0) })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={ep.title}
                            onChange={(e) => patchEpisode(sIdx, eIdx, { title: e.target.value })}
                            placeholder={`Episode ${ep.number}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Runtime (min)</Label>
                          <Input
                            type="number"
                            value={ep.runtimeMinutes}
                            onChange={(e) => patchEpisode(sIdx, eIdx, { runtimeMinutes: e.target.value })}
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          {season.episodes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEpisode(sIdx, eIdx)}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="md:col-span-4 space-y-1">
                          <Label className="text-xs">Video URL (S3 link)</Label>
                          <Input
                            value={ep.videoUrl}
                            onChange={(e) => patchEpisode(sIdx, eIdx, { videoUrl: e.target.value })}
                            placeholder="https://your-bucket.s3.amazonaws.com/berserk-s1e1.mp4"
                          />
                        </div>
                        <div className="md:col-span-4 space-y-1">
                          <Label className="text-xs">Description (optional)</Label>
                          <Textarea
                            value={ep.description}
                            onChange={(e) => patchEpisode(sIdx, eIdx, { description: e.target.value })}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addEpisode(sIdx)}>
                      <Plus className="h-4 w-4" />
                      Add episode
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSeason}>
                <Plus className="h-4 w-4" />
                Add season
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/media")}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending} className="gap-2">
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </div>
      </form>
    </AdminShell>
  );
};
