import { cn } from "@/lib/cn";
import { iconArtwork, type IconName } from "./generated/icons";

export type { IconName };

/** Directional icons flip in RTL; every other icon keeps its drawn orientation. */
const DIRECTIONAL: ReadonlySet<IconName> = new Set<IconName>(["arrow-right", "arrow-up-right"]);

export const ICON_NAMES = Object.keys(iconArtwork) as IconName[];
export const PILLAR_ICONS = ["brand", "digital", "intelligence", "growth"] as const satisfies readonly IconName[];

type IconProps = {
  name: IconName;
  size?: number;
  /** Accessible label; omit for decorative icons next to visible text. */
  label?: string;
  className?: string;
};

/** Brand icon set from public/brand/icons (24 px grid, 1.5 px stroke, square caps, mitre joins). */
export function Icon({ name, size = 24, label, className }: IconProps) {
  const art = iconArtwork[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={art.viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cn("shrink-0", DIRECTIONAL.has(name) && "rtl:-scale-x-100", className)}
      dangerouslySetInnerHTML={{ __html: art.inner }}
    />
  );
}
