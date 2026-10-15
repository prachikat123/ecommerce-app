import type { CSSProperties } from "react";
import { cn } from "../lib/cn";

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  title?: string;
  style?: CSSProperties;
}

/** Material Symbols icon wrapper. */
export function Icon({ name, className, filled, title, style }: IconProps) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{ ...(filled ? { fontVariationSettings: "'FILL' 1" } : null), ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      title={title}
    >
      {name}
    </span>
  );
}
