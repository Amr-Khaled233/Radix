"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/cn";

/** Short visible labels; the accessible name keeps the full language name. */
const SHORT: Record<Locale, string> = { en: "EN", ar: "AR" };

function Switcher({ query, className }: { query?: Record<string, string>; className?: string }) {
  const t = useTranslations("locale");
  const active = useLocale();
  const pathname = usePathname();
  const other = routing.locales.find((locale) => locale !== active) ?? routing.defaultLocale;

  return (
    <Link
      href={{ pathname, query }}
      locale={other}
      hrefLang={other}
      aria-label={t("switchTo", { language: t(other) })}
      className={cn(
        "type-label text-label hover:text-foreground inline-flex min-h-11 items-center px-1 transition-colors duration-(--duration-hover)",
        className,
      )}
    >
      {SHORT[other]}
    </Link>
  );
}

function SwitcherWithQuery({ className }: { className?: string }) {
  const params = useSearchParams();
  const query = Object.fromEntries(params.entries());
  return <Switcher query={query} className={className} />;
}

/** Shows only the other language (EN on Arabic pages, عربي on English ones); keeps the page and query string. */
export function LocaleSwitcher({ className }: { className?: string }) {
  return (
    <Suspense fallback={<Switcher className={className} />}>
      <SwitcherWithQuery className={className} />
    </Suspense>
  );
}
