"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { Icon } from "@/components/brand/icon";
import { formatIndex } from "@/components/brand/index-marker";
import { cn } from "@/lib/cn";
import type { NavCategory } from "./nav-types";

type ServicesMenuProps = {
  label: string;
  categories: NavCategory[];
};

/** "Services" disclosure used on mid-width screens where categories can't be listed inline. */
export function ServicesMenu({ label, categories }: ServicesMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        root.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        data-active={pathname === "/services" || pathname.startsWith("/services/") || undefined}
        className="nav-underline type-button text-foreground hover:text-muted inline-flex items-center gap-1.5 py-2 transition-colors duration-(--duration-hover)"
      >
        {label}
        <Icon
          name="plus"
          size={16}
          className={cn("transition-transform duration-(--duration-ui) ease-brand", open && "rotate-45")}
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="bg-surface border-line absolute inset-s-0 top-full z-50 mt-3 min-w-64 border p-2"
      >
        <ul>
          {categories.map((category) => (
            <li key={category.href}>
              <Link
                href={category.href}
                onClick={() => setOpen(false)}
                className="hover:bg-background flex items-baseline gap-3 px-3 py-2.5 transition-colors duration-(--duration-ui)"
              >
                <span className="type-label text-label tabular-nums">
                  <bdi>{formatIndex(category.index)}</bdi>
                </span>
                <span className="type-button text-foreground">{category.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
