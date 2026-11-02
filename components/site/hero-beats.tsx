import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n/routing";
import { beatState } from "@/lib/hero/math";
import { t as localized } from "@/lib/localized";
import type { HeroConfig } from "@/lib/settings/schemas";
import { cn } from "@/lib/cn";

type Beat = HeroConfig["beats"][number];

const STYLE: Record<Beat["style"], string> = {
  label: "type-label",
  display: "type-display",
  h2: "type-h2",
  body: "type-body-lg max-w-xl",
};

const INLINE: Record<Beat["position"]["inline"], string> = {
  start: "justify-start text-start",
  center: "justify-center text-center",
  end: "justify-end text-end",
};

const BLOCK: Record<Beat["position"]["block"], string> = {
  top: "items-start",
  middle: "items-center",
  bottom: "items-end",
};

/**
 * Text beats over the hero stage. `progress` is 0–100; when null, every
 * visible beat is shown statically (reduced motion / static fallback).
 * Ivory on the always-dark stage; only opacity and transform change.
 */
export function HeroBeats({
  beats,
  locale,
  progress,
  className,
  compact = false,
  beatRef,
}: {
  beats: Beat[];
  locale: Locale;
  progress: number | null;
  className?: string;
  /** Smaller type for the dashboard preview frame. */
  compact?: boolean;
  /** Receives each beat's text element so a scroll loop can animate it without re-rendering. */
  beatRef?: (id: string, element: HTMLElement | null) => void;
}) {
  const visible = beats.filter((beat) => beat.visible && localized(beat.text, locale));
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      {visible.map((beat) => {
        const state = progress === null ? { opacity: 1, offset: 0 } : beatState(beat, progress);
        const style: CSSProperties = {
          opacity: state.opacity,
          transform: `translate3d(0, ${state.offset}px, 0)`,
        };
        return (
          <div
            key={beat.id}
            className={cn(
              "absolute inset-0 flex p-(--gutter)",
              INLINE[beat.position.inline],
              BLOCK[beat.position.block],
              // Clear the scroll cue and skip link (bottom-fib-34, ~56px tall).
              !compact && beat.position.block === "bottom" && "pb-[calc(var(--spacing-fib-89)+var(--spacing-fib-21))]",
            )}
          >
            <p
              ref={beatRef ? (el) => beatRef(beat.id, el) : undefined}
              data-beat-from={beat.from}
              data-beat-to={beat.to}
              style={style}
              className={cn(
                STYLE[beat.style],
                "text-(--palette-ivory) will-change-[opacity,transform]",
                beat.style === "label" && "text-(--palette-lavender)",
                compact && beat.style === "display" && "text-[clamp(1.25rem,4cqw,3rem)]",
                compact && beat.style === "h2" && "text-[clamp(1rem,3cqw,2rem)]",
                compact && beat.style === "body" && "text-[clamp(0.7rem,1.6cqw,1rem)]",
              )}
            >
              {localized(beat.text, locale)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
