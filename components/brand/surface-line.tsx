import { cn } from "@/lib/cn";

type SurfaceLineProps = {
  /** Optional mono label sitting just above the line at inline-start (e.g. "SURFACE"). */
  label?: string;
  /** Extend to the viewport edges even inside a centred container. */
  fullBleed?: boolean;
  className?: string;
};

/**
 * A. Surface line — the 2 px rule dividing outcome (above) from foundation
 * (below). One per composition. Draws from inline-start inside a <Reveal>.
 */
export function SurfaceLine({ label, fullBleed = true, className }: SurfaceLineProps) {
  return (
    <div className={className}>
      {label ? <span className="type-label text-label mb-1 block">{label}</span> : null}
      <div aria-hidden className={cn("reveal-surface bg-line-strong h-0.5", fullBleed && "full-bleed")} />
    </div>
  );
}
