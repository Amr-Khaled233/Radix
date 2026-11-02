"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Icon } from "@/components/brand/icon";
import { formatIndex } from "@/components/brand/index-marker";
import type { NavCategory, NavLink } from "./nav-types";

type MobileMenuProps = {
  logo: ReactNode;
  links: NavLink[];
  categories: NavCategory[];
  servicesLabel: string;
  cta: NavLink;
  controls: ReactNode;
};

/** Full-screen menu (native modal <dialog>: focus trap, Esc and inert page for free). */
export function MobileMenu({ logo, links, categories, servicesLabel, cta, controls }: MobileMenuProps) {
  const t = useTranslations("nav");
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  // Close after any in-menu link is followed.
  const closeOnLink = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("openMenu")}
        className="border-line-strong text-foreground inline-flex size-11 items-center justify-center border"
      >
        <Icon name="menu" />
      </button>

      <dialog
        ref={dialog}
        aria-label={t("menu")}
        onClose={() => setOpen(false)}
        onClick={closeOnLink}
        className="bg-background text-foreground m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto p-0 backdrop:bg-transparent"
      >
        <div className="container-site flex min-h-full flex-col">
          <div className="flex h-16 items-center justify-between">
            {logo}
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              aria-label={t("closeMenu")}
              className="border-line-strong inline-flex size-11 items-center justify-center border"
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="bg-line-strong full-bleed h-0.5" aria-hidden />

          <nav className="flex-1 py-fib-34">
            <ul className="space-y-fib-21">
              {links.map((link, i) => {
                const isServices = link.href === "/services";
                return (
                  <li key={link.href}>
                    <Link href={link.href} className="group flex items-baseline gap-4">
                      <span className="type-label text-label w-8 shrink-0 tabular-nums">
                        <bdi>{formatIndex(i + 1)}</bdi>
                      </span>
                      <span className="type-h2 group-hover:text-muted transition-colors">
                        {isServices ? servicesLabel : link.label}
                      </span>
                    </Link>
                    {isServices && categories.length ? (
                      <ul className="ms-12 mt-fib-13 space-y-2">
                        {categories.map((category) => (
                          <li key={category.href}>
                            <Link href={category.href} className="flex items-baseline gap-3">
                              <span className="type-label text-label tabular-nums">
                                <bdi>{formatIndex(category.index)}</bdi>
                              </span>
                              <span className="type-h4">{category.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-line space-y-fib-21 border-t py-fib-34">
            <Link
              href={cta.href}
              className="type-button bg-accent text-on-accent inline-flex min-h-12 w-full items-center justify-center gap-2 px-6"
            >
              {cta.label}
              <Icon name="arrow-right" size={20} />
            </Link>
            <div className="flex items-center justify-between">{controls}</div>
          </div>
        </div>
      </dialog>
    </>
  );
}
