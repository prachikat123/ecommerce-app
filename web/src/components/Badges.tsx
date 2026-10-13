import { Icon } from "./Icon";
import { cn } from "../lib/cn";

/** Harvest-gold discount sticker. */
export function DiscountBadge({ percent, size = "md" }: { percent: number; size?: "sm" | "md" }) {
  if (percent <= 0) return null;
  return (
    <span
      className={cn(
        "rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold inline-flex items-center",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px] font-label-sm"
      )}
    >
      {percent}% OFF
    </span>
  );
}

/** Forest-green authenticity / certification pill. */
export function TrustBadge({
  label,
  icon = "verified",
  size = "md"
}: {
  label: string;
  icon?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "rounded-full bg-secondary-container text-on-secondary-container font-bold inline-flex items-center gap-0.5",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px] font-label-sm"
      )}
    >
      <Icon name={icon} className="text-[10px]" filled />
      {label}
    </span>
  );
}

/** Neutral info pill (e.g. pack size, subsidy). */
export function InfoPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "primary" | "amber" }) {
  const tones = {
    neutral: "bg-surface-container-high text-on-surface",
    primary: "bg-primary-fixed text-on-primary-fixed",
    amber: "bg-tertiary-fixed text-on-tertiary-fixed"
  } as const;
  return (
    <span className={cn("px-1.5 py-0.5 rounded font-label-sm text-label-sm font-semibold", tones[tone])}>
      {label}
    </span>
  );
}
