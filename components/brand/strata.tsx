import { cn } from "@/lib/cn";

/** Fibonacci gaps between strata hairlines (guidelines: 8 · 13 · 21 · 34 · 55 · 89 · 144 px). */
export const STRATA_GAPS = [8, 13, 21, 34, 55, 89, 144] as const;

type StrataProps = {
  /** How many hairlines to draw (1–7). */
  count?: number;
  fullBleed?: boolean;
  className?: string;
};

/** B. Strata — hairlines below the surface line expressing depth and growth. */
export function Strata({ count = STRATA_GAPS.length, fullBleed = true, className }: StrataProps) {
  const gaps = STRATA_GAPS.slice(0, Math.max(1, Math.min(count, STRATA_GAPS.length)));
  return (
    <div aria-hidden className={cn("pointer-events-none", fullBleed && "full-bleed", className)}>
      {gaps.map((gap) => (
        <div key={gap} className="reveal-settle bg-line h-px w-full" style={{ marginTop: gap - 1 }} />
      ))}
    </div>
  );
}
