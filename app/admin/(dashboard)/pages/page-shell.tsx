import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import type { SettingsKey } from "@/lib/settings/schemas";
import { readSetting } from "@/lib/settings/store";

type EditorComponent = ComponentType<{ initial: Record<string, unknown>; canEdit: boolean }>;

/** Shared server part of the settings-backed page editors. */
export async function PageEditorShell({
  settingKey,
  messageKey,
  Editor,
}: {
  settingKey: SettingsKey;
  messageKey: "home" | "about" | "process" | "privacy" | "footer";
  Editor: EditorComponent;
}) {
  const user = await requireAdminPage();
  if (!can(user, "view", "pages")) notFound();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.pages" });
  const value = (await readSetting(settingKey)) as Record<string, unknown>;
  return (
    <>
      <PageHeader label={t("label")} title={t(`${messageKey}.title`)} description={t(`${messageKey}.description`)} />
      <Editor initial={value} canEdit={can(user, "edit", "pages")} />
    </>
  );
}
