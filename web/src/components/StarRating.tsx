import { Icon } from "./Icon";
import { cn } from "../lib/cn";
import { formatCount } from "../lib/format";

interface StarRatingProps {
  rating: number;
  count?: number;
  className?: string;
}

export function StarRating({ rating, count, className }: StarRatingProps) {
  return (
    <span className={cn("flex items-center gap-1", className)}>
      <span className="text-tertiary-container font-label-sm text-label-sm font-bold flex items-center">
        <Icon name="star" filled className="text-[14px]" />
        {rating.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="font-body-sm text-[11px] text-outline">({formatCount(count)})</span>
      )}
    </span>
  );
}
