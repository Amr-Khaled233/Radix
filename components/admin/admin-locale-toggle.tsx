"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { controlBoxClass } from "@/components/site/theme-toggle";
import { cn } from "@/lib/cn";
import { setAdminLocale } from "@/lib/admin/actions";

export function AdminLocaleToggle({ className }: { className?: string }) {
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
      className={cn(controlBoxClass, "disabled:opacity-60", className)}
    >
      {t("language")}
    </button>
  );
}
