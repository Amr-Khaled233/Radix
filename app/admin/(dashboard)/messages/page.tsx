import { desc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { categories, contactSubmissions } from "@/lib/db/schema";
import { getMessageScope, scopeWhere } from "@/lib/messages/access";
import { MessagesInbox } from "./messages-inbox";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.messages" });
  return { title: t("title") };
}

export default async function MessagesPage() {
  const user = await requireAdminPage();
  // Super admin: every message. Others: only the pillars they are responsible for.
  const scope = await getMessageScope(user);
  if (!scope) notFound();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin" });
  const [rows, cats] = await Promise.all([
    db
      .select()
      .from(contactSubmissions)
      .where(scopeWhere(scope))
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(2000),
    db.select({ id: categories.id, name: categories.name }).from(categories),
  ]);

  return (
    <>
      <PageHeader
        label={t("messages.label")}
        title={t("messages.title")}
        description={t("messages.description")}
        actions={
          rows.length ? (
            <a
              href="/api/messages/export"
              download
              className="type-button border-line-strong text-foreground hover:bg-foreground hover:text-background inline-flex h-10 items-center border px-4 text-sm"
            >
              {t("actions.export")}
            </a>
          ) : null
        }
      />
      <MessagesInbox
        messages={rows.map((r) => ({ ...r, ipHash: null, createdAt: r.createdAt.toISOString() }))}
        categories={cats}
      />
    </>
  );
}
