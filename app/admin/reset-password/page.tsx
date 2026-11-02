import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AuthShell } from "@/components/admin/auth-shell";
import { FormMessage } from "@/components/admin/form-controls";
import { ResetForm } from "@/components/admin/reset-form";
import { getAdminLocale } from "@/lib/admin/locale";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.reset" });
  return { title: t("title") };
}

/** Handles both password-reset links (1 h) and admin invitations (48 h, `invite=1`). */
export default async function ResetPasswordPage({ searchParams }: PageProps<"/admin/reset-password">) {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.reset" });
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  const isInvite = params.invite === "1";
  const linkError = params.error === "INVALID_TOKEN";

  return (
    <AuthShell
      label={t("label")}
      title={isInvite ? t("inviteTitle") : t("title")}
      intro={isInvite ? t("inviteBody") : undefined}
    >
      {token && !linkError ? (
        <ResetForm token={token} />
      ) : (
        <div className="space-y-fib-21">
          <FormMessage tone="error">{linkError ? t("invalidToken") : t("missingToken")}</FormMessage>
          <Link
            href="/admin/forgot-password"
            className="type-body text-foreground text-sm underline underline-offset-4"
          >
            {t("requestNew")}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
