import { Icon } from "./Icon";
import { cn } from "../lib/cn";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
}

/** Large thumb-accessible stepper (min 44px controls) per the design system. */
export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled,
  size = "md",
  label = "Quantity"
}: QuantityStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  const btn =
    size === "md"
      ? "w-11 h-11 min-w-[44px]"
      : "w-9 h-9 min-w-[36px] text-[18px]";

  return (
    <div
      className="inline-flex items-center rounded-xl border border-outline-variant bg-white overflow-hidden"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className={cn("flex items-center justify-center text-on-surface active:bg-surface-container-high disabled:opacity-40", btn)}
      >
        <Icon name="remove" />
      </button>
      <span
        className={cn(
          "tabular text-title-md font-bold text-on-surface text-center min-w-[2.5rem]",
          size === "sm" && "text-body-md"
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className={cn("flex items-center justify-center text-on-surface active:bg-surface-container-high disabled:opacity-40", btn)}
      >
        <Icon name="add" />
      </button>
    </div>
  );
}
