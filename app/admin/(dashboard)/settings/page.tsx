import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { mediaByIds } from "@/lib/admin/media";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { readSetting } from "@/lib/settings/store";
import { SettingsForm } from "./settings-form";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.settings" });
  return { title: t("title") };
}

export default async function SettingsPage() {
  const user = await requireAdminPage();
  if (!can(user, "view", "settings")) notFound();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.settings" });
  const [general, seo, contact, locale] = await Promise.all([
    readSetting("general"),
    readSetting("seo"),
    readSetting("contact"),
    readSetting("locale"),
  ]);
  const [ogImage] = await mediaByIds([seo.defaultOgImageId]);

  return (
    <>
      <PageHeader label={t("label")} title={t("title")} description={t("description")} />
      <SettingsForm initial={{ general, seo, contact, locale }} ogImage={ogImage ?? null} />
    </>
  );
}
