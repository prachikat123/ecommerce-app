import type { ReactNode } from "react";

/**
 * Simple content wrapper. The app-level chrome lives in `AppShell`;
 * this keeps page files declarative and easy to re-skin.
 */
export function AppShellLayout({ children }: { children: ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
