import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/admin/auth-shell";
import { ForgotForm } from "@/components/admin/forgot-form";
import { getAdminLocale } from "@/lib/admin/locale";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.forgot" });
  return { title: t("title") };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.forgot" });
  return (
    <AuthShell label={t("label")} title={t("title")} intro={t("body")}>
      <ForgotForm />
    </AuthShell>
  );
}
