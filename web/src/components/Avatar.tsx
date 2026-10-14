import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { Icon } from "./Icon";

interface AvatarProps {
  src?: string | null;
  name?: string;
  role?: string;
  /** Rendered diameter in pixels. */
  size?: number;
  className?: string;
}

/**
 * Circular profile photo with a graceful fallback: the user's initials when a
 * name is available, otherwise a role icon (farmer / storefront).
 */
export function Avatar({ src, name, role, size = 40, className }: AvatarProps) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className={cn(
        "rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-secondary-container text-on-secondary-container font-title-md font-bold select-none",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {src && !broken ? (
        <img
          src={src}
          alt={name ? `${name}'s profile photo` : "Profile photo"}
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : initials ? (
        initials
      ) : (
        <Icon name={role === "SELLER" ? "storefront" : "agriculture"} filled style={{ fontSize: size * 0.55 }} />
      )}
    </span>
  );
}
