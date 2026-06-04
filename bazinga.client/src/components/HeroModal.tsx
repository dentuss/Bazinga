import { Heart, Shield, Sparkles, Sword, X, Zap } from "lucide-react";
import type { SuperheroDto } from "@/lib/metadata";
import { cn } from "@/lib/utils";

const STAT_ICONS = {
  intelligence: Sparkles,
  strength: Sword,
  speed: Zap,
  durability: Shield,
  power: Sparkles,
  combat: Sword,
} as const;

interface HeroModalProps {
  hero: SuperheroDto;
  onClose: () => void;
}

const HeroModal = ({ hero, onClose }: HeroModalProps) => {
  const stats: Array<[keyof typeof STAT_ICONS, number]> = [
    ["intelligence", hero.powerstats.intelligence],
    ["strength", hero.powerstats.strength],
    ["speed", hero.powerstats.speed],
    ["durability", hero.powerstats.durability],
    ["power", hero.powerstats.power],
    ["combat", hero.powerstats.combat],
  ];
  return (
    <div
      className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl overflow-hidden border border-primary/40 bg-card shadow-[0_0_60px_hsl(0_82%_55%/0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="grid md:grid-cols-[260px_1fr]">
          <div className="relative bg-black h-64 md:h-auto">
            {hero.images.lg || hero.images.md ? (
              <img
                src={hero.images.lg ?? hero.images.md!}
                alt={hero.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-5xl font-black text-white/30">
                {hero.name.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <h2 className="text-3xl font-black tracking-tight">{hero.name}</h2>
              {hero.fullName && (
                <p className="text-sm text-muted-foreground mt-1">{hero.fullName}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                {hero.publisher && (
                  <span className="border border-primary/40 text-primary rounded-full px-2 py-0.5">
                    {hero.publisher}
                  </span>
                )}
                {hero.alignment && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5",
                      hero.alignment === "bad"
                        ? "bg-red-500/15 text-red-400 border border-red-500/40"
                        : hero.alignment === "neutral"
                          ? "bg-yellow-400/15 text-yellow-400 border border-yellow-400/40"
                          : "bg-green-500/15 text-green-400 border border-green-500/40"
                    )}
                  >
                    {hero.alignment}
                  </span>
                )}
                {hero.race && (
                  <span className="border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                    {hero.race}
                  </span>
                )}
              </div>
            </div>

            {hero.aliases.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Aliases: </span>
                <span className="text-foreground/85">{hero.aliases.join(" · ")}</span>
              </div>
            )}

            <div className="grid gap-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Powerstats
              </p>
              {stats.map(([key, value]) => {
                const Icon = STAT_ICONS[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs uppercase tracking-wider text-muted-foreground w-24 shrink-0">
                      {key}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-orange-500"
                        style={{ width: `${Math.max(2, value)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-8 text-right">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>

            {hero.occupation && <Detail label="Occupation" value={hero.occupation} />}
            {hero.groupAffiliation && (
              <Detail
                label="Affiliations"
                value={hero.groupAffiliation}
                icon={<Heart className="h-3.5 w-3.5" />}
              />
            )}
            {hero.placeOfBirth && <Detail label="Place of birth" value={hero.placeOfBirth} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const Detail = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) => (
  <div className="text-sm">
    <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
      {icon}
      {label}
    </p>
    <p className="text-foreground/85 mt-0.5 leading-relaxed">{value}</p>
  </div>
);

export default HeroModal;
