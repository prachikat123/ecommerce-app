import { Link } from "react-router-dom";
import { Icon } from "./Icon";

interface SectionHeaderProps {
  title: string;
  icon?: string;
  actionLabel?: string;
  actionTo?: string;
  subtitle?: string;
}

export function SectionHeader({ title, icon, actionLabel, actionTo, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          {icon && <Icon name={icon} className="text-primary text-[22px]" filled />}
          <h2 className="font-title-lg text-title-lg text-on-surface font-bold">{title}</h2>
        </div>
        {subtitle && <p className="font-body-sm text-body-sm text-outline mt-0.5">{subtitle}</p>}
      </div>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="font-label-md text-label-md text-primary font-bold flex items-center">
          {actionLabel}
          <Icon name="chevron_right" className="text-[16px]" />
        </Link>
      )}
    </div>
  );
}
