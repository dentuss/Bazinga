import { useEffect, useRef, useState } from "react";
import { Lock, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PinEntryModalProps {
  open: boolean;
  title?: string;
  description?: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: (pin: string) => void;
  onClose: () => void;
  /** Optional submit label. Defaults to "Unlock". */
  submitLabel?: string;
}

/**
 * Netflix-style 4-box PIN entry. Auto-advances on input, deletes back on
 * backspace, submits when all four digits are filled.
 */
const PinEntryModal = ({
  open,
  title = "Enter PIN",
  description = "This profile is locked. Enter the 4-digit PIN to continue.",
  busy,
  error,
  onSubmit,
  onClose,
  submitLabel = "Unlock",
}: PinEntryModalProps) => {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (open) {
      setDigits(["", "", "", ""]);
      // autofocus the first box on next paint
      setTimeout(() => inputs.current[0]?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const setDigit = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 3) inputs.current[index + 1]?.focus();
    if (v && index === 3 && next.every((d) => d !== "")) {
      // Submit on the final digit.
      onSubmit(next.join(""));
    }
  };

  const handleBackspace = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", ""].map((_, i) => text[i] ?? "");
    setDigits(next);
    if (text.length === 4) onSubmit(text);
    else inputs.current[Math.min(text.length, 3)]?.focus();
  };

  const handleManualSubmit = () => {
    const value = digits.join("");
    if (value.length === 4) onSubmit(value);
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-xl border border-primary/40 bg-card shadow-[0_0_60px_hsl(0_82%_55%/0.35)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 grid place-items-center transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 grid place-items-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleBackspace(i, e)}
              onPaste={handlePaste}
              maxLength={1}
              className={cn(
                "h-14 rounded-md bg-background border-2 border-border text-center text-2xl font-black tracking-widest outline-none focus:border-primary focus:shadow-[0_0_24px_hsl(0_82%_55%/0.35)] transition-all",
                error && "border-red-500/60"
              )}
              aria-label={`PIN digit ${i + 1}`}
            />
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}

        <Button
          type="button"
          onClick={handleManualSubmit}
          disabled={busy || digits.some((d) => !d)}
          className="mt-6 w-full"
          size="lg"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Checking…" : submitLabel}
        </Button>
      </div>
    </div>
  );
};

export default PinEntryModal;
