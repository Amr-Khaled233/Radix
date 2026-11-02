"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

const ORDER = ["system", "light", "dark"] as const;
type ThemeChoice = (typeof ORDER)[number];

const subscribe = () => () => {};

/** Cycles System → Light → Dark. Shows the current choice as a mono label. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("theme");
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const current: ThemeChoice = mounted && ORDER.includes(theme as ThemeChoice) ? (theme as ThemeChoice) : "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const name = t(current);

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={t("current", { theme: name })}
      title={t("label")}
      className={cn(
        "type-label text-label hover:text-foreground inline-flex min-h-11 min-w-11 items-center justify-center gap-2 transition-colors duration-(--duration-hover)",
        className,
      )}
    >
      <span aria-hidden className="border-current relative inline-block size-3 overflow-hidden border">
        <span
          className={cn(
            "bg-current absolute inset-y-0 inset-s-0",
            current === "system" && "w-1/2",
            current === "light" && "w-0",
            current === "dark" && "w-full",
          )}
        />
      </span>
      <span suppressHydrationWarning>{name}</span>
    </button>
  );
}
