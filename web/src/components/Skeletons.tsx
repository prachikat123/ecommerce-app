import { cn } from "../lib/cn";

export function ProductCardSkeleton({ variant = "grid" }: { variant?: "grid" | "deal" }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface-container-lowest p-space-sm shadow-sm",
        variant === "deal" && "w-64 shrink-0"
      )}
    >
      <div className="skeleton w-full h-32 rounded-xl" />
      <div className="mt-3 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-10 w-full rounded-xl mt-3" />
      </div>
    </div>
  );
}

export function CartLineSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl bg-surface-container-lowest p-3 shadow-sm">
      <div className="skeleton w-20 h-20 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="skeleton h-3 w-1/4 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return <div className="skeleton h-24 rounded-2xl" />;
}
