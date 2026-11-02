"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

/**
 * Warns before losing unsaved form changes: browser close/reload, and clicks
 * on in-app links (the App Router has no navigation-blocking API).
 */
export function UnsavedGuard({ dirty }: { dirty: boolean }) {
  const t = useTranslations("admin.unsaved");

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (anchor.origin !== window.location.origin) return;
      if (!window.confirm(t("leave"))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, t]);

  return dirty ? (
    <span role="status" className="type-label text-warning">
      {t("badge")}
    </span>
  ) : null;
}
