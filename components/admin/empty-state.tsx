import type { ReactNode } from "react";

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border-line flex flex-col items-start gap-3 border border-dashed p-8">
      <p className="type-h4 text-foreground">{title}</p>
      {body ? <div className="text-muted max-w-lg text-sm">{body}</div> : null}
      {action}
    </div>
  );
}

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
