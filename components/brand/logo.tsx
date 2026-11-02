import { cn } from "@/lib/cn";
import { logoArtwork, type LogoVariant } from "./generated/logos";

/**
 * The RADIX logo, rendered from the supplied SVG artwork (fills swapped to
 * currentColor by scripts/generate-brand-assets.ts; geometry untouched).
 *
 * - Colour follows `color` — use only approved logo/background pairs.
 * - Never mirrored: the svg is forced to `direction: ltr` and has no RTL transforms.
 * - `clearSpace` (default on) adds the guideline clear space x inside the
 *   viewBox, so nothing can sit closer than x to the artwork.
 * - `height` sets the artwork height in px (clear space is added around it).
 */

/** Clear space x as a share of each artwork's height (icon: 25% of its width). */
const CLEAR_SPACE: Record<LogoVariant, number> = {
  horizontal: 0.312, // x-height of the "r" = 49.73 / 159.19
  vertical: 0.141, // 22.83 / 161.39
  wordmark: 0.63, // 49.73 / 78.98
  icon: 0.25, // 25% of the icon width (≈ height)
};

/** Minimum artwork widths in px from the guidelines; switch versions below these. */
export const LOGO_MIN_WIDTH: Record<LogoVariant, number> = {
  horizontal: 220,
  vertical: 140,
  wordmark: 72,
  icon: 16,
};

type LogoProps = {
  variant?: LogoVariant;
  height?: number;
  clearSpace?: boolean;
  /** Accessible name. Pass `null` when the logo is decorative next to visible text. */
  title?: string | null;
  className?: string;
};

export function Logo({ variant = "horizontal", height, clearSpace = true, title = "RADIX", className }: LogoProps) {
  const art = logoArtwork[variant];
  const [, , w, h] = art.viewBox.split(" ").map(Number);
  const x = clearSpace ? h * CLEAR_SPACE[variant] : 0;
  const viewBox = `${-x} ${-x} ${w + 2 * x} ${h + 2 * x}`;
  const scale = height ? height / h : undefined;

  if (process.env.NODE_ENV !== "production" && scale && w * scale < LOGO_MIN_WIDTH[variant]) {
    console.warn(
      `<Logo variant="${variant}"> renders ${Math.round(w * scale)}px wide, below the ${LOGO_MIN_WIDTH[variant]}px minimum.`,
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={scale ? (w + 2 * x) * scale : undefined}
      height={scale ? (h + 2 * x) * scale : undefined}
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={cn("block shrink-0 [direction:ltr]", className)}
    >
      {title ? <title>{title}</title> : null}
      <g fill="currentColor" dangerouslySetInnerHTML={{ __html: art.paths }} />
    </svg>
  );
}
