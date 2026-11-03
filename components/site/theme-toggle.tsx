"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

const subscribe = () => () => {};

/** Light ⇄ dark. Shows the mode it switches to (like the language switch shows the other language). */
export function ThemeToggle({ className }: { className?: string }) {
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
        "type-label text-label hover:text-foreground inline-flex min-h-11 min-w-11 items-center justify-center gap-2 transition-colors duration-(--duration-hover)",
        className,
      )}
    >
      <span aria-hidden className="border-current relative inline-block size-3 overflow-hidden border">
        <span className={cn("bg-current absolute inset-y-0 inset-s-0", next === "dark" ? "w-full" : "w-0")} />
      </span>
      <span suppressHydrationWarning>{name}</span>
    </button>
  );
}
