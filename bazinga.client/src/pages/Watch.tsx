import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Pause,
  Play,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchMediaBySlug, type MediaEpisode, type MediaItem } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";
import { hasTVAccess } from "@/lib/access";
import { cn } from "@/lib/utils";

/**
 * Watch page — the source of truth is now /api/media/{slug}. Legacy id shapes
 * (anime-X / show-X) come from rail cards backed by external metadata (Jikan
 * / TVMaze) that may have no DB row yet; when the slug doesn't resolve we
 * show a friendly "coming soon" upsell instead of bouncing the user.
 */
const Watch = () => {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const canWatch = hasTVAccess(user?.subscriptionType);

  const mediaQuery = useQuery({
    queryKey: ["media", "detail", slug],
    queryFn: () => fetchMediaBySlug(slug!),
    enabled: !!slug,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // ---- Episode navigation state (reset whenever the media item changes) ----
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setSeasonIndex(0);
    setEpisodeIndex(0);
  }, [mediaQuery.data?.id]);

  const entry: MediaItem | undefined = mediaQuery.data;
  const season = entry?.seasons[seasonIndex];
  const episode: MediaEpisode | undefined = season?.episodes[episodeIndex];

  const advanceEpisode = () => {
    if (!entry) return;
    const current = entry.seasons[seasonIndex];
    if (current && episodeIndex + 1 < current.episodes.length) {
      setEpisodeIndex((i) => i + 1);
      return;
    }
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

  // ---- Render --------------------------------------------------------------
  // Auth + subscription gates first; the route is wrapped in RequireProfile
  // already, but a TV-only deep link is still possible and needs to bounce.
  if (!user) return <Navigate to="/auth" replace />;
  if (!canWatch) return <Navigate to="/bazinga-unlimited" replace />;

  if (!slug) return <Navigate to="/bazinga-tv" replace />;

  if (mediaQuery.isLoading) {
    return (
      <div className="fixed inset-0 z-[90] grid place-items-center bg-black text-white">
        <p className="text-sm text-white/70 inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("manga.loading")}
        </p>
      </div>
    );
  }

  // Unknown slug, or known item but no episodes have been added yet — show
  // a friendly "coming soon" surface instead of a broken player. This is also
  // the fallback for legacy anime-X / show-X cards backed by external metadata
  // that the admin hasn't promoted into the DB.
  if (!entry || !season || !episode) {
    return <ComingSoon title={slug} />;
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black text-white flex flex-col">
      <div className="relative flex-1 min-h-0 bg-black">
        <video
          ref={videoRef}
          key={`${entry.id}-s${seasonIndex}-e${episodeIndex}`}
          src={episode.videoUrl}
          poster={episode.thumbnail ?? entry.backdropImage ?? undefined}
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

        <div className="absolute top-0 left-0 right-0 z-10 px-4 py-3 flex items-start justify-between pointer-events-none">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 hover:bg-black/80 transition-colors"
            aria-label={t("episodes.backToShow")}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">{t("episodes.backToShow")}</span>
          </button>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] text-orange-400">
              {t("episodes.nowPlaying")}
            </p>
            <p className="text-sm md:text-base font-black uppercase tracking-tight">
              {entry.title}
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.3em] text-orange-400">
                {t("episodes.season")} {season.number} ·{" "}
                {t("episodes.episodeNum", { n: episode.number })}
              </p>
              <h2 className="text-lg md:text-2xl font-black tracking-tight truncate">
                {episode.title}
              </h2>
              {episode.description && (
                <p className="mt-0.5 text-xs md:text-sm text-white/70 max-w-2xl line-clamp-1 md:line-clamp-2">
                  {episode.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", pickerOpen && "rotate-180")}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {pickerOpen && (
        <div className="border-t border-white/10 bg-card max-h-[55vh] overflow-y-auto">
          <div className="container mx-auto px-4 md:px-8 py-6 space-y-6">
            {entry.seasons.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {entry.seasons.map((s, i) => (
                  <button
                    key={s.id}
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
              {season.episodes.map((ep, i) => {
                const isCurrent = i === episodeIndex;
                const isPast = i < episodeIndex;
                return (
                  <li key={ep.id}>
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
                        <p className="font-bold truncate">{ep.title}</p>
                        {ep.description && (
                          <p className="text-xs text-white/70 line-clamp-2">{ep.description}</p>
                        )}
                      </div>
                      {ep.runtimeMinutes ? (
                        <span className="flex items-center gap-1 text-xs text-white/60 shrink-0">
                          <Clock className="h-3 w-3" />
                          {ep.runtimeMinutes} {t("episodes.duration")}
                        </span>
                      ) : null}
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

/**
 * Friendly fallback for slugs that don't resolve (typo'd URL, or an anime/show
 * card backed by external metadata that the admin hasn't promoted into the
 * DB yet). Lets the user navigate back rather than dropping them on a 404.
 */
const ComingSoon = ({ title }: { title?: string }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black text-white">
      <div className="max-w-md text-center space-y-5 px-6">
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-orange-400">
          {t("comingSoon.label")}
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          {title ?? t("comingSoon.title")}
        </h1>
        <p className="text-sm text-white/70 leading-relaxed">
          {t("comingSoon.body")}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <Link to="/bazinga-tv">{t("comingSoon.backToTv")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Watch;
