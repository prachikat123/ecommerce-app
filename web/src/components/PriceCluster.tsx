import { formatINR } from "../lib/format";
import { cn } from "../lib/cn";

interface PriceClusterProps {
  price: number;
  mrp: number;
  discountPercent?: number;
  size?: "card" | "hero";
  className?: string;
}

/** High-contrast numeric price hierarchy: bold price, strikethrough MRP, % off. */
export function PriceCluster({ price, mrp, discountPercent, size = "card", className }: PriceClusterProps) {
  const showMrp = mrp > price;
  return (
    <div className={cn("flex items-baseline gap-2 flex-wrap", className)}>
      <span
        className={cn(
          "tabular text-primary font-bold font-price-card",
          size === "hero" ? "text-price-hero" : "text-price-card"
        )}
      >
        {formatINR(price)}
      </span>
      {showMrp && (
        <span className={cn("tabular text-outline line-through", size === "hero" ? "text-body-md" : "text-[11px]")}>
          {formatINR(mrp)}
        </span>
      )}
      {showMrp && discountPercent !== undefined && discountPercent > 0 && (
        <span className="font-label-sm text-label-sm text-tertiary font-bold">{discountPercent}% off</span>
      )}
    </div>
  );
}
