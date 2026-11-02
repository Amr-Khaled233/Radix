"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/cn";

const SHORT: Record<Locale, string> = { en: "EN", ar: "عربي" };

function Switcher({ query, className }: { query?: Record<string, string>; className?: string }) {
  const t = useTranslations("locale");
  const active = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className={cn("flex items-center", className)}>
      {routing.locales.map((locale, i) => (
        <span key={locale} className="flex items-center">
          {i > 0 ? (
            <span aria-hidden className="text-line mx-1.5">
              |
            </span>
          ) : null}
          <Link
            href={{ pathname, query }}
            locale={locale}
            lang={locale}
            hrefLang={locale}
            aria-current={locale === active ? "true" : undefined}
            aria-label={locale === active ? t(locale) : t("switchTo", { language: t(locale) })}
            className={cn(
              "inline-flex min-h-11 items-center px-1 transition-colors duration-(--duration-hover)",
              locale === "ar" ? "font-sans text-sm font-medium" : "type-label",
              locale === active ? "text-foreground" : "text-label hover:text-foreground",
            )}
          >
            {SHORT[locale]}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function SwitcherWithQuery({ className }: { className?: string }) {
  const params = useSearchParams();
  const query = Object.fromEntries(params.entries());
  return <Switcher query={query} className={className} />;
}

/** `EN | عربي` — keeps the current page and query string; next-intl sets the NEXT_LOCALE cookie. */
export function LocaleSwitcher({ className }: { className?: string }) {
  return (
    <Suspense fallback={<Switcher className={className} />}>
      <SwitcherWithQuery className={className} />
    </Suspense>
  );
}
