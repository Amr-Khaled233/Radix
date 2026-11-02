"use client";

import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

/** Toasts styled with brand tokens: square, hairline border, status colour on the inline-start edge. */
export function Toaster() {
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      dir={locale === "ar" ? "rtl" : "ltr"}
      position={locale === "ar" ? "bottom-left" : "bottom-right"}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "bg-surface text-foreground border-line flex w-[356px] items-start gap-3 border border-s-4 px-4 py-3 text-sm",
          success: "border-s-success",
          error: "border-s-danger",
          title: "font-semibold",
          description: "text-muted",
        },
      }}
    />
  );
}
