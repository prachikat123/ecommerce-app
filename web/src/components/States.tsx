import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";

interface StateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({ icon = "inventory_2", title, description, actionLabel, onAction, children }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-3">
        <Icon name={icon} className="text-[32px] text-primary" />
      </div>
      <h3 className="font-title-lg text-title-lg text-on-surface font-bold">{title}</h3>
      {description && <p className="font-body-sm text-body-sm text-outline mt-1 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}

export function ErrorState({ title, description, onAction }: Omit<StateProps, "icon" | "actionLabel" | "children"> & { onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mb-3">
        <Icon name="cloud_off" className="text-[32px] text-error" />
      </div>
      <h3 className="font-title-lg text-title-lg text-on-surface font-bold">{title}</h3>
      {description && <p className="font-body-sm text-body-sm text-outline mt-1 max-w-sm">{description}</p>}
      {onAction && (
        <Button variant="secondary" icon="refresh" className="mt-4" onClick={onAction}>
          Retry
        </Button>
      )}
    </div>
  );
}
