"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

const subscribe = () => () => {};

/** The framed control style shared by the theme and language switches, so both read as buttons. */
export const controlBoxClass =
  "type-label inline-flex min-h-11 min-w-11 items-center justify-center px-3 border border-line-strong text-foreground hover:bg-foreground hover:text-background transition-colors duration-(--duration-hover)";

/**
 * Light ⇄ dark, written as a word (LIGHT / DARK). Like the language switch (which shows the other
 * language), it names the mode it switches to; the accessible name says so in full.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("theme");
  const { resolvedTheme, setTheme } = useTheme();
  // The saved theme is only known in the browser: render as dark (the default) until mounted.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const next = mounted && resolvedTheme === "light" ? "dark" : "light";
  const name = t(next);

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={t("switchTo", { theme: name })}
      title={t("label")}
      className={cn(controlBoxClass, className)}
    >
      {name}
    </button>
  );
}
