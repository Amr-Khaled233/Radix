import { inArray } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { mediaByIds } from "@/lib/admin/media";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { frameSequences } from "@/lib/db/schema";
import { readSetting } from "@/lib/settings/store";
import { HeroEditor } from "./hero-editor";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.hero" });
  return { title: t("title") };
}

export default async function HeroPage() {
  const user = await requireAdminPage();
  if (!can(user, "view", "pages")) notFound();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin" });
  const hero = await readSetting("hero");
  const configs = [hero.current, hero.previous].filter(Boolean) as (typeof hero.current)[];
  const media = await mediaByIds(configs.flatMap((c) => Object.values(c.assets)));
  const sequenceIds = configs
    .flatMap((c) => [c.frames.desktop, c.frames.mobile])
    .filter((id): id is string => Boolean(id));
  const sequences = sequenceIds.length
    ? await db.select().from(frameSequences).where(inArray(frameSequences.id, sequenceIds))
    : [];

  return (
    <>
      <PageHeader label={t("pages.label")} title={t("hero.title")} description={t("hero.description")} />
      <HeroEditor
        initial={hero.current}
        hasPrevious={Boolean(hero.previous)}
        media={media}
        sequences={sequences.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
        canEdit={can(user, "edit", "pages")}
      />
    </>
  );
}
