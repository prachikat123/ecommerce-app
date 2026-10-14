import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "../lib/cn";

interface OtpInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly length?: number;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  readonly error?: boolean;
  readonly ariaLabel?: string;
}

/**
 * Segmented one-time-code field: one box per digit, with auto-advance,
 * backspace-to-previous, arrow-key navigation, and paste support.
 * The emitted value is always a contiguous string of digits.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  error = false,
  ariaLabel = "One-time password"
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const handleInput = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const next = (value.slice(0, index) + digit + value.slice(index + 1)).slice(0, length);
    onChange(next);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        const prev = index - 1;
        onChange(value.slice(0, prev) + value.slice(prev + 1));
        refs.current[prev]?.focus();
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    event.preventDefault();
    onChange(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-1.5" onPaste={handlePaste}>
      {chars.map((char, index) => {
        const active = index === value.length;
        return (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            value={char}
            onChange={(event) => handleInput(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            disabled={disabled}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            aria-label={`${ariaLabel} digit ${index + 1}`}
            className={cn(
              "w-12 h-12 rounded-xl border text-center font-headline-md text-headline-md outline-none transition-all tabular",
              error
                ? "border-error text-error bg-surface-container-lowest"
                : char
                  ? "border-primary/50 bg-primary-container/5 text-primary font-bold"
                  : active && !disabled
                    ? "border-2 border-primary bg-surface-container-lowest ring-2 ring-primary/20"
                    : "border-outline-variant bg-surface-container-low text-on-surface"
            )}
          />
        );
      })}
    </div>
  );
}
