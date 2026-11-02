"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/admin/action";

type RunOptions<T> = {
  /** Toast key under admin.toast, or false for no success toast. */
  success?: "saved" | "created" | "deleted" | "reordered" | "updated" | false;
  onSuccess?: (data: T) => void;
  onError?: (result: Extract<ActionResult<T>, { ok: false }>) => void;
  refresh?: boolean;
};

/** Runs a Server Action with pending state, localized toasts and a router refresh. */
export function useAction() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    <T>(action: () => Promise<ActionResult<T>>, options: RunOptions<T> = {}) =>
      new Promise<ActionResult<T>>((resolve) => {
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            if (options.success !== false) toast.success(t(`toast.${options.success ?? "saved"}`));
            options.onSuccess?.(result.data);
            if (options.refresh !== false) router.refresh();
          } else {
            toast.error(t(`errors.${result.error}`));
            options.onError?.(result);
            if (result.error === "unauthorized") router.replace("/admin/login");
          }
          resolve(result);
        });
      }),
    [router, t],
  );

  return { run, pending };
}
