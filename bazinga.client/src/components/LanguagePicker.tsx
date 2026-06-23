import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguagePickerProps {
  variant?: "ghost" | "outline";
  showLabel?: boolean;
}

const LANGS = [
  { code: "en", labelKey: "language.en" },
  { code: "uk", labelKey: "language.uk" },
] as const;

const LanguagePicker = ({ variant = "ghost", showLabel = false }: LanguagePickerProps) => {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const currentLabel = current.toUpperCase().slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("language.label")}
        className={
          variant === "outline"
            ? "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-bold uppercase hover:border-primary/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
            : "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold uppercase text-foreground/80 hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
        }
      >
        <Globe className="h-4 w-4" />
        {showLabel ? t("language.label") : currentLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-36">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => void i18n.changeLanguage(l.code)}
            className="gap-2 cursor-pointer"
          >
            <span
              className={
                current === l.code
                  ? "text-primary font-bold"
                  : "text-foreground"
              }
            >
              {t(l.labelKey)}
            </span>
            {current === l.code && (
              <span className="ml-auto text-primary">●</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguagePicker;
