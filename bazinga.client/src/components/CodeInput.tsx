import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired when all boxes are filled. */
  onComplete?: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
  /** Mask digits (PIN style). Default false — codes are shown. */
  mask?: boolean;
}

/**
 * Boxed numeric code entry (default 6 digits) used for TOTP codes and the like.
 * Auto-advances, backspaces to the previous box, and supports paste.
 */
const CodeInput = ({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus,
  disabled,
  error,
  mask = false,
}: CodeInputProps) => {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputs.current[0]?.focus(), 30);
  }, [autoFocus]);

  const update = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const setAt = (index: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    const arr = digits.slice();
    arr[index] = d;
    update(arr.join(""));
    if (d && index < length - 1) inputs.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    update(text);
    inputs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type={mask ? "password" : "text"}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          value={d}
          disabled={disabled}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          maxLength={1}
          className={cn(
            "h-12 w-10 md:h-14 md:w-12 rounded-md bg-background border-2 border-border text-center text-xl font-black outline-none transition-all",
            "focus:border-primary focus:shadow-[0_0_20px_hsl(0_82%_55%/0.3)]",
            error && "border-red-500/60",
            disabled && "opacity-60"
          )}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

export default CodeInput;
