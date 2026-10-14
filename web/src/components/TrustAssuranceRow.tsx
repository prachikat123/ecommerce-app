import { cn } from "../lib/cn";
import { Icon } from "./Icon";

export interface TrustAssuranceItem {
  readonly icon: string;
  readonly label: string;
  readonly sub: string;
  readonly tone?: "primary" | "secondary" | "tertiary";
}

const toneClass: Record<NonNullable<TrustAssuranceItem["tone"]>, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary"
};

export const DEFAULT_TRUST_ITEMS: readonly TrustAssuranceItem[] = [
  { icon: "verified", label: "100% Genuine", sub: "ICAR Certified", tone: "primary" },
  { icon: "local_shipping", label: "Village Drop", sub: "Pin-code Delivery", tone: "tertiary" },
  { icon: "shield_lock", label: "AgriStack", sub: "Govt Secure Link", tone: "secondary" }
];

interface TrustAssuranceRowProps {
  readonly items?: readonly TrustAssuranceItem[];
}

/** Compact three-up reassurance strip used across auth / checkout surfaces. */
export function TrustAssuranceRow({ items = DEFAULT_TRUST_ITEMS }: TrustAssuranceRowProps) {
  return (
    <section className="rounded-xl p-3 border border-outline-variant/20 bg-surface-container-high/40">
      <div className="grid grid-cols-3 gap-2 text-center divide-x divide-outline-variant/30">
        {items.map((item) => (
          <div key={item.label} className="px-1 flex flex-col items-center">
            <Icon name={item.icon} filled className={cn("text-[20px]", toneClass[item.tone ?? "primary"])} />
            <span className="font-label-sm text-label-sm text-on-surface font-semibold mt-1">{item.label}</span>
            <span className="text-[9px] text-on-surface-variant leading-none mt-0.5">{item.sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
