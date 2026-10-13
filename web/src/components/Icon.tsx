import { cn } from "../lib/cn";

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  title?: string;
}

/** Material Symbols icon wrapper. */
export function Icon({ name, className, filled, title }: IconProps) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      title={title}
    >
      {name}
    </span>
  );
}
