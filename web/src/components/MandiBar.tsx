import { formatINR } from "../lib/format";

interface MandiBarProps {
  mandiPrice: number;
  price: number;
  savings: number;
}

/** Mandi price comparative micro-bar: local Mandi rate vs direct-to-farm saving. */
export function MandiBar({ mandiPrice, price, savings }: MandiBarProps) {
  void price;
  return (
    <div className="w-full mt-1.5 py-1 px-2 rounded-lg bg-surface-container-low flex items-center justify-between text-[11px] font-label-sm">
      <span className="text-on-surface-variant">Local Mandi: {formatINR(mandiPrice)}</span>
      <span className="text-primary font-bold">Save {formatINR(savings)} here</span>
    </div>
  );
}
