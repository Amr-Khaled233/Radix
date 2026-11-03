import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { requireAdminPage } from "@/lib/auth/session";
import { ProfileView } from "./profile-view";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.profile" });
  return { title: t("title") };
}

export default async function ProfilePage() {
  const user = await requireAdminPage();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.profile" });
  return (
    <>
      <PageHeader label={t("label")} title={t("title")} />
      <ProfileView
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          preferredLocale: user.preferredLocale === "ar" ? "ar" : "en",
          preferredTheme: user.preferredTheme === "light" ? "light" : "dark",
        }}
      />
    </>
  );
}
