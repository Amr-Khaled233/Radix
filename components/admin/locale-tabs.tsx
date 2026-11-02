"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/cn";
import { uiIcon } from "./ui-icon";

export type Completeness = { en: boolean; ar: boolean };

/** "EN ✓ · AR ⚠" — compact per-item translation status. */
export function CompletenessBadge({ value, needsReview }: { value: Completeness; needsReview?: boolean }) {
  const t = useTranslations("admin.locale");
  return (
    <span className="type-label inline-flex items-center gap-2">
      {(["en", "ar"] as const).map((locale) => (
        <span
          key={locale}
          className={cn("inline-flex items-center gap-1", value[locale] ? "text-success" : "text-warning")}
          title={`${t(locale)}: ${value[locale] ? t("complete") : t("missing")}`}
        >
          {locale.toUpperCase()}
          {value[locale] ? <Check {...uiIcon} size={12} /> : <TriangleAlert {...uiIcon} size={12} />}
        </span>
      ))}
      {needsReview ? <span className="text-warning">· {t("needsReview")}</span> : null}
    </span>
  );
}

type LocaleTabsProps = {
  completeness: Completeness;
  children: (locale: Locale) => ReactNode;
};

/** EN | AR tabs for localized form fields; each tab sets the field direction. */
export function LocaleTabs({ completeness, children }: LocaleTabsProps) {
  const t = useTranslations("admin.locale");
  const [active, setActive] = useState<Locale>("en");

  return (
    <div>
      <div role="tablist" aria-label={t("en") + " / " + t("ar")} className="border-line flex border-b">
        {(["en", "ar"] as const).map((locale) => (
          <button
            key={locale}
            type="button"
            role="tab"
            id={`tab-${locale}`}
            aria-selected={active === locale}
            aria-controls={`panel-${locale}`}
            onClick={() => setActive(locale)}
            className={cn(
              "-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold",
              active === locale
                ? "border-accent text-foreground"
                : "text-muted hover:text-foreground border-transparent",
            )}
          >
            <span lang={locale}>{t(locale)}</span>
            {completeness[locale] ? (
              <Check {...uiIcon} size={14} className="text-success" />
            ) : (
              <TriangleAlert {...uiIcon} size={14} className="text-warning" />
            )}
          </button>
        ))}
      </div>
      {(["en", "ar"] as const).map((locale) => (
        <div
          key={locale}
          role="tabpanel"
          id={`panel-${locale}`}
          aria-labelledby={`tab-${locale}`}
          hidden={active !== locale}
          lang={locale}
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="space-y-5 pt-5"
        >
          {children(locale)}
        </div>
      ))}
    </div>
  );
}
