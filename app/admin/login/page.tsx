import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/admin/auth-shell";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminLocale } from "@/lib/admin/locale";
import { getAdminUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.login" });
  return { title: t("title") };
}

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getAdminUser()) redirect("/admin");
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.login" });
  const { reset } = await searchParams;

  return (
    <AuthShell label={t("label")} title={t("title")}>
      <LoginForm notice={reset === "1" ? t("resetDone") : undefined} />
    </AuthShell>
  );
}
