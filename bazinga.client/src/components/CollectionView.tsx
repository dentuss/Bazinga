import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { resolveImageUrl } from "@/lib/images";
import { useCollections } from "@/contexts/CollectionsContext";
import { type CollectionItem, type CollectionName } from "@/lib/collections";
import { cn } from "@/lib/utils";

interface CollectionTab {
  /** "all" or a CollectionKind. */
  value: string;
  label: string;
}

interface CollectionViewProps {
  collection: CollectionName;
  items: CollectionItem[];
  accent: "red" | "orange";
  title: string;
  subtitle?: string;
  emptyMessage: string;
  tabs: CollectionTab[];
  onOpen: (item: CollectionItem) => void;
}

/**
 * Shared "saved items" browser used by both the Comics Library and the TV
 * My List. Provides All / kind tabs, a live search box, a responsive grid and
 * a hover-to-remove control. The parent owns the detail modals and reacts via
 * onOpen so each side can pop the right modal (Comic/Manga vs Anime/Show).
 */
const CollectionView = ({
  collection,
  items,
  accent,
  title,
  subtitle,
  emptyMessage,
  tabs,
  onOpen,
}: CollectionViewProps) => {
  const { remove } = useCollections();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const accentText = accent === "orange" ? "text-orange-500" : "text-primary";
  const activeChip =
    accent === "orange"
      ? "bg-orange-500 text-black border-orange-500"
      : "bg-primary text-primary-foreground border-primary";

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const i of items) map[i.kind] = (map[i.kind] ?? 0) + 1;
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (tab !== "all" && i.kind !== tab) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        (i.subtitle ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, tab, query]);

  return (
    <section className="container mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="mb-6">
        <p className={cn("text-xs md:text-sm font-bold uppercase tracking-[0.3em]", accentText)}>
          {title}
        </p>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider transition-colors",
                tab === t.value
                  ? activeChip
                  : "border-border text-muted-foreground hover:border-foreground/60 hover:text-foreground"
              )}
            >
              {t.label}
              <span className="ml-1.5 opacity-70">{counts[t.value] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your collection…"
            className="w-full h-10 rounded-md bg-card border border-border pl-9 pr-3 text-sm outline-none focus:border-foreground/40"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-16 text-center">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {filtered.map((item) => (
            <Tile
              key={`${item.kind}:${item.contentId}`}
              item={item}
              accent={accent}
              onOpen={() => onOpen(item)}
              onRemove={() => void remove(collection, item.kind, item.contentId)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const Tile = ({
  item,
  accent,
  onOpen,
  onRemove,
}: {
  item: CollectionItem;
  accent: "red" | "orange";
  onOpen: () => void;
  onRemove: () => void;
}) => {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const ring =
    accent === "orange"
      ? "group-hover:ring-orange-500/60 group-hover:shadow-orange-500/30"
      : "group-hover:ring-primary/60 group-hover:shadow-primary/30";
  const seed = (item.title.charCodeAt(0) ?? 0) % 4;
  const fallbackBg = [
    "from-primary/40 via-primary/15 to-orange-500/30",
    "from-orange-500/35 via-primary/20 to-primary/30",
    "from-primary/35 via-purple-500/15 to-primary/40",
    "from-orange-500/40 via-primary/25 to-orange-500/25",
  ][seed];

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 rounded-md"
      >
        <div
          className={cn(
            "relative aspect-[2/3] rounded-md overflow-hidden bg-card shadow-lg ring-1 ring-transparent transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:ring-2",
            ring
          )}
        >
          <div aria-hidden className={cn("absolute inset-0 bg-gradient-to-br", fallbackBg)} />
          <div aria-hidden className="absolute inset-0 grid place-items-center text-center px-3">
            <span className="text-xs font-black uppercase tracking-wider text-white/85 line-clamp-3 drop-shadow">
              {item.title}
            </span>
          </div>
          {item.image && (
            <img
              src={resolveImageUrl(item.image)}
              alt={item.title}
              loading="lazy"
              className="relative h-full w-full object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="mt-2 text-sm font-bold line-clamp-1">{item.title}</h3>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">{item.subtitle}</p>
        )}
      </button>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-black/90 transition-opacity"
        aria-label={`Remove ${item.title}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("confirmRemove.title")}
        description={t("confirmRemove.body", { title: item.title })}
        cancelLabel={t("confirmRemove.cancel")}
        confirmLabel={t("confirmRemove.confirm")}
        onConfirm={onRemove}
      />
    </div>
  );
};

export default CollectionView;
