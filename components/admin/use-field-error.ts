"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

/** Translates zod issue messages (keys under admin.validation) for display. */
export function useFieldError() {
  const t = useTranslations("admin.validation");
  return useCallback(
    (error: { message?: string } | undefined) => {
      if (!error?.message) return undefined;
      return t.has(error.message as never) ? t(error.message as never) : error.message;
    },
    [t],
  );
}
