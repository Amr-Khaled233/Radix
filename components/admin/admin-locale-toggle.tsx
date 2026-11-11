"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setAdminLocale } from "@/lib/admin/actions";

export function AdminLocaleToggle() {
  const t = useTranslations("admin.common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t("languageLabel")}
      onClick={() =>
        startTransition(async () => {
          await setAdminLocale(next);
          router.refresh();
        })
      }
      className="type-label text-label hover:text-foreground inline-flex min-h-11 items-center px-2 transition-colors disabled:opacity-60"
    >
      {t("language")}
    </button>
  );
}
