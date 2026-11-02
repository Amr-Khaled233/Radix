import type { ReactNode } from "react";

const TONES = {
  neutral: "border-line text-muted",
  accent: "border-accent text-foreground",
  success: "border-success text-success",
  warning: "border-warning text-warning",
  danger: "border-danger text-danger",
} as const;

/** Outlined status label (dashboard-only status colours). */
export function StatusBadge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`type-label inline-flex items-center border px-2 py-0.5 ${TONES[tone]}`}>{children}</span>;
}
