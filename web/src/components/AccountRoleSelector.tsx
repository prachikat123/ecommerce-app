import type { LoginRole } from "../hooks/useLoginFlow";
import { cn } from "../lib/cn";
import { Icon } from "./Icon";

interface RoleOption {
  readonly value: LoginRole;
  readonly icon: string;
  readonly title: string;
  readonly subtitle: string;
}

const ROLES: readonly RoleOption[] = [
  { value: "CUSTOMER", icon: "agriculture", title: "Farmer / Buyer", subtitle: "Buy inputs & sell harvest" },
  { value: "SELLER", icon: "storefront", title: "Dealer / FPO", subtitle: "Manage stock & listings" }
];

interface AccountRoleSelectorProps {
  readonly value: LoginRole;
  readonly onChange: (role: LoginRole) => void;
  readonly disabled?: boolean;
}

/** Two-up segmented control for choosing the sign-in account type. */
export function AccountRoleSelector({ value, onChange, disabled = false }: AccountRoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Select account type">
      {ROLES.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative p-3 rounded-xl text-left transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none",
              active
                ? "border-2 border-primary bg-primary-container/5 shadow-sm"
                : "border border-outline-variant/50 bg-surface hover:bg-surface-container"
            )}
          >
            {active && (
              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <Icon name="check" className="text-[13px]" />
              </span>
            )}
            <span
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center mb-1.5",
                active ? "bg-primary-container/15 text-primary" : "bg-surface-container text-on-surface-variant"
              )}
            >
              <Icon name={option.icon} filled={active} className="text-[20px]" />
            </span>
            <span
              className={cn(
                "block font-title-md text-title-md",
                active ? "text-primary font-bold" : "text-on-surface font-semibold"
              )}
            >
              {option.title}
            </span>
            <span className="block font-body-sm text-[11px] text-on-surface-variant leading-tight mt-0.5">
              {option.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
