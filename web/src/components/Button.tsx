import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "soft";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-container shadow-sm",
  secondary: "bg-white text-primary border-[1.5px] border-primary hover:bg-primary-fixed/30",
  accent: "bg-harvest text-white hover:bg-harvest-deep shadow-sm",
  ghost: "bg-transparent text-on-surface hover:bg-surface-container-high",
  soft: "bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary"
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-11 px-4 text-title-md rounded-xl gap-1.5",
  lg: "h-12 px-5 text-title-md rounded-xl gap-2"
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Icon name="progress_activity" className="text-[18px] animate-spin" />
      ) : (
        icon && <Icon name={icon} className="text-[18px]" />
      )}
      {children}
    </button>
  );
}
