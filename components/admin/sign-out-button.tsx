"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const t = useTranslations("admin.common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut();
          router.replace("/admin/login");
          router.refresh();
        })
      }
      className="type-button border-line-strong text-foreground hover:bg-foreground hover:text-background inline-flex min-h-11 items-center border px-5 transition-colors disabled:opacity-60"
    >
      {t("signOut")}
    </button>
  );
}
