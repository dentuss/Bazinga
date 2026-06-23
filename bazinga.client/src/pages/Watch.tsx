import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Pause,
  Play,
  SkipForward,
} from "lucide-react";
import {
  buildWatchEntry,
  getCuratedEntry,
  type Episode,
  type WatchEntry,
} from "@/data/episodeCatalogue";
import { getTrailer } from "@/data/trailers";
import { fetchAnime, fetchSuperheroShow, stripHtml } from "@/lib/metadata";
import { cn } from "@/lib/utils";

type PlaybackKind = "trailer" | "anime" | "show" | null;

const parseId = (raw: string | undefined): { kind: PlaybackKind; key: string | null } => {
  if (!raw) return { kind: null, key: null };
  if (raw.startsWith("anime-")) return { kind: "anime", key: raw.slice("anime-".length) };
  if (raw.startsWith("show-")) return { kind: "show", key: raw.slice("show-".length) };
  return { kind: "trailer", key: raw };
};

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { kind, key } = useMemo(() => parseId(id), [id]);

  // ---- Source-of-truth catalogue --------------------------------------------
  // Trailer ids resolve immediately. Anime/Show ids fetch metadata so the
  // synthesized episode list carries the real title + description.

  const animeQuery = useQuery({
    queryKey: ["watch-anime", key],
    queryFn: () => fetchAnime(Number(key)),
    enabled: kind === "anime" && !!key,
    staleTime: 15 * 60 * 1000,
  });

  const showQuery = useQuery({
    queryKey: ["watch-show", key],
    queryFn: () => fetchSuperheroShow(Number(key)),
    enabled: kind === "show" && !!key,
    staleTime: 15 * 60 * 1000,
  });

  const entry: WatchEntry | null = useMemo(() => {
    if (kind === "trailer" && key) {
      const trailer = getTrailer(key);
      if (!trailer) return null;
      const curated = getCuratedEntry(`trailer-${key}`);
      if (curated) return curated;
      // Trailer without curated episodes: build a single-episode entry.
      return {
        id: `trailer-${key}`,
        title: trailer.title,
        tagline: trailer.tagline,
        description: trailer.description,
        year: trailer.year,
        rating: trailer.rating,
        genres: trailer.genres,
        seasons: [
          {
            number: 1,
            episodes: [
              {
                number: 1,
                title: trailer.title,
                description: trailer.description,
                runtimeMinutes: 0,
                src: trailer.src,
              },
            ],
          },
        ],
      };
    }
    if (kind === "anime" && animeQuery.data) {
      const a = animeQuery.data;
      return buildWatchEntry({
        id: `anime-${a.malId}`,
        title: a.titleEnglish ?? a.title,
        description: a.synopsis ?? "",
        backdrop: a.trailerImageUrl ?? a.largeImageUrl ?? a.imageUrl ?? undefined,
        year: a.year ?? undefined,
        rating: a.rating ?? undefined,
        genres: a.genres,
        totalEpisodes: a.episodes ?? 8,
      });
    }
    if (kind === "show" && showQuery.data) {
      const s = showQuery.data;
      return buildWatchEntry({
        id: `show-${s.id}`,
        title: s.name,
        description: stripHtml(s.summary) || "",
        backdrop: s.imageOriginal ?? s.imageMedium ?? undefined,
        year: s.premiered ? Number(s.premiered.slice(0, 4)) : undefined,
        rating: s.rating ? `★ ${s.rating.toFixed(1)}` : undefined,
        genres: s.genres,
        totalEpisodes: 12,
      });
    }
    return null;
  }, [kind, key, animeQuery.data, showQuery.data]);

  // ---- Episode state ---------------------------------------------------------
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setSeasonIndex(0);
    setEpisodeIndex(0);
  }, [entry?.id]);

  const season = entry?.seasons[seasonIndex];
  const episode: Episode | undefined = season?.episodes[episodeIndex];

  const advanceEpisode = () => {
    if (!entry) return;
    const currentSeason = entry.seasons[seasonIndex];
    if (currentSeason && episodeIndex + 1 < currentSeason.episodes.length) {
      setEpisodeIndex((i) => i + 1);
      return;
    }
    // Next season's first episode if available.
    if (seasonIndex + 1 < entry.seasons.length) {
      setSeasonIndex((s) => s + 1);
      setEpisodeIndex(0);
    }
  };

  const stepEpisode = (delta: 1 | -1) => {
    if (!entry) return;
    const sIdx = seasonIndex;
    const eIdx = episodeIndex + delta;
    const cur = entry.seasons[sIdx];
    if (!cur) return;
    if (eIdx >= 0 && eIdx < cur.episodes.length) {
      setEpisodeIndex(eIdx);
      return;
    }
    if (delta === 1 && sIdx + 1 < entry.seasons.length) {
      setSeasonIndex(sIdx + 1);
      setEpisodeIndex(0);
    } else if (delta === -1 && sIdx > 0) {
      const prev = entry.seasons[sIdx - 1];
      setSeasonIndex(sIdx - 1);
      setEpisodeIndex(prev.episodes.length - 1);
    }
  };

  // ---- Render ----------------------------------------------------------------

  if (kind === null || !key) {
    return (
      <div className="fixed inset-0 z-[90] grid place-items-center bg-black text-white">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Trailer not found.</p>
          <button
            type="button"
            onClick={() => navigate("/bazinga-tv")}
            className="text-orange-500 hover:text-orange-400 underline"
          >
            Back to BazingaTV
          </button>
        </div>
      </div>
    );
  }

  const loading = (kind === "anime" && animeQuery.isLoading) || (kind === "show" && showQuery.isLoading);
  if (loading || !entry || !episode) {
    return (
      <div className="fixed inset-0 z-[90] grid place-items-center bg-black text-white">
        <p className="text-sm text-white/70">Loading…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black text-white flex flex-col">
      {/* Video player */}
      <div className="relative flex-1 min-h-0 bg-black">
        <video
          ref={videoRef}
          key={`${entry.id}-s${seasonIndex}-e${episodeIndex}`}
          src={episode.src}
          poster={entry.backdrop}
          className="h-full w-full object-contain bg-black"
          autoPlay={playing}
          controls
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            if (autoplay) advanceEpisode();
          }}
        />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-3 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 hover:bg-black/80 transition-colors"
            aria-label={t("episodes.backToShow")}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">{t("episodes.backToShow")}</span>
          </button>
          <div className="pointer-events-none text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] text-orange-400">
              {t("episodes.nowPlaying")}
            </p>
            <p className="text-sm md:text-base font-black uppercase tracking-tight">
              {entry.title}
            </p>
          </div>
        </div>

        {/* Bottom episode strip */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
          <div className="bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-12 pb-4">
            <div className="container mx-auto px-4 md:px-8 pointer-events-auto">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-orange-400">
                    {t("episodes.season")} {season?.number} · {t("episodes.episodeNum", { n: episode.number })}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight truncate">
                    {episode.title}
                  </h2>
                  <p className="mt-1 text-sm text-white/80 max-w-2xl line-clamp-2">
                    {episode.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepEpisode(-1)}
                    className="rounded-full bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <SkipForward className="h-4 w-4 rotate-180" />
                    {t("episodes.prevEpisode")}
                  </button>
                  <button
                    type="button"
                    onClick={() => stepEpisode(1)}
                    className="rounded-full bg-orange-500 text-black hover:bg-orange-400 px-3 py-2 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <SkipForward className="h-4 w-4" />
                    {t("episodes.nextEpisode")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoplay((v) => !v)}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-bold inline-flex items-center gap-1",
                      autoplay ? "bg-white/15 text-white" : "bg-white/5 text-white/70"
                    )}
                  >
                    {autoplay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    {autoplay ? t("episodes.autoplayOn") : t("episodes.autoplayOff")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerOpen((p) => !p)}
                    className="rounded-full bg-white/15 hover:bg-white/25 px-3 py-2 text-xs font-bold inline-flex items-center gap-1"
                  >
                    {t("episodes.title")}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", pickerOpen && "rotate-180")} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episode picker drawer — slides up from below */}
      {pickerOpen && (
        <div className="border-t border-white/10 bg-card max-h-[55vh] overflow-y-auto">
          <div className="container mx-auto px-4 md:px-8 py-6 space-y-6">
            {entry.seasons.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {entry.seasons.map((s, i) => (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => setSeasonIndex(i)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider border",
                      i === seasonIndex
                        ? "bg-orange-500 text-black border-orange-500"
                        : "bg-transparent text-white/80 border-white/20 hover:border-white/60"
                    )}
                  >
                    {t("episodes.seasonOf", { n: s.number })}
                  </button>
                ))}
              </div>
            )}
            <ul className="grid gap-2">
              {season?.episodes.map((ep, i) => {
                const isCurrent = i === episodeIndex;
                const isPast = i < episodeIndex;
                return (
                  <li key={ep.number}>
                    <button
                      type="button"
                      onClick={() => {
                        setEpisodeIndex(i);
                        setPickerOpen(false);
                      }}
                      className={cn(
                        "group w-full flex items-center gap-4 rounded-lg border bg-card/60 p-3 text-left transition-all",
                        isCurrent
                          ? "border-orange-500/80 bg-orange-500/10"
                          : "border-border/60 hover:border-orange-500/40"
                      )}
                    >
                      <span
                        className={cn(
                          "grid place-items-center h-10 w-10 rounded-md text-sm font-black",
                          isCurrent
                            ? "bg-orange-500 text-black"
                            : isPast
                              ? "bg-white/10 text-white/60"
                              : "bg-white/5 text-white"
                        )}
                      >
                        {isPast && !isCurrent ? <CheckCircle2 className="h-4 w-4" /> : ep.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">
                          {ep.title}
                        </p>
                        <p className="text-xs text-white/70 line-clamp-2">{ep.description}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-white/60 shrink-0">
                        <Clock className="h-3 w-3" />
                        {ep.runtimeMinutes} {t("episodes.duration")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
