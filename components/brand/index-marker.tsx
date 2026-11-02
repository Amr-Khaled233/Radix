import { cn } from "@/lib/cn";

type IndexMarkerProps = {
  /** Index number; numbers are padded to two digits ("01"). */
  n: number | string;
  label?: string;
  /** "label": mono 12 px label colour. "large": violet index ≥ 24 px (passes contrast as large text). */
  size?: "label" | "large";
  className?: string;
};

export function formatIndex(n: number | string) {
  return typeof n === "number" ? String(n).padStart(2, "0") : n;
}

/** D. Index marker — mono numbers and labels that make structure visible: `01 — BRAND`. */
export function IndexMarker({ n, label, size = "label", className }: IndexMarkerProps) {
  if (size === "large") {
    return (
      <span
        className={cn(
          "font-mono text-accent text-[clamp(1.5rem,1rem+2vw,2.5rem)] leading-none tabular-nums",
          className,
        )}
      >
        <bdi>{formatIndex(n)}</bdi>
      </span>
    );
  }
  return (
    <span className={cn("type-label text-label inline-flex gap-[0.6em]", className)}>
      <bdi className="tabular-nums">{formatIndex(n)}</bdi>
      {label ? (
        <>
          <span aria-hidden>—</span>
          <span>{label}</span>
        </>
      ) : null}
    </span>
  );
}
