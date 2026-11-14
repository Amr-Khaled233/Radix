"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

const subscribe = () => () => {};

/** The framed control style shared by the theme and language switches, so both read as buttons. */
export const controlBoxClass =
  "border-line-strong text-foreground hover:bg-foreground hover:text-background border transition-colors duration-(--duration-hover)";

/**
 * Light ⇄ dark. Shows the mode it switches to (like the language switch shows the other language).
 * `compact` keeps only the mark (the phone header bar); the accessible name always says what it does.
 */
export function ThemeToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const t = useTranslations("theme");
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const current = mounted && resolvedTheme === "light" ? "light" : "dark";
  const next = current === "dark" ? "light" : "dark";
  const name = t(next);

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={t("switchTo", { theme: name })}
      title={t("label")}
      className={cn(
        "type-label inline-flex min-h-11 min-w-11 items-center justify-center gap-2",
        controlBoxClass,
        !compact && "px-3",
        className,
      )}
    >
      {/* Half-filled square: the mark of the mode it switches to (filled = dark). */}
      <span aria-hidden className="border-current relative inline-block size-4 overflow-hidden border-2">
        <span className={cn("bg-current absolute inset-y-0 inset-s-0", next === "dark" ? "w-full" : "w-1/2")} />
      </span>
      {compact ? null : <span suppressHydrationWarning>{name}</span>}
    </button>
  );
}
