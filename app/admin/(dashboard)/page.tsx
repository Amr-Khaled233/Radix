import { count, desc, eq } from "drizzle-orm";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { connection } from "next/server";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import {
  auditLog,
  categories,
  contactSubmissions,
  projects,
  services,
  settings,
  teamMembers,
  user as userTable,
} from "@/lib/db/schema";
import { completeness, type Localized } from "@/lib/localized";
import { countNewMessages, getMessageScope, scopeWhere } from "@/lib/messages/access";

/** Counts items whose Arabic is missing (required fields) or still flagged for review. */
async function translationGaps() {
  const [cats, svc, projs, team, pages] = await Promise.all([
    db
      .select({ name: categories.name, tagline: categories.tagline, review: categories.arNeedsReview })
      .from(categories),
    db.select({ name: services.name, review: services.arNeedsReview }).from(services),
    db.select({ title: projects.title, summary: projects.summary, review: projects.arNeedsReview }).from(projects),
    db.select({ name: teamMembers.name, role: teamMembers.role, review: teamMembers.arNeedsReview }).from(teamMembers),
    db.select().from(settings),
  ]);
  const gap = (fields: Localized[], review: boolean) => review || !completeness(fields).ar;
  return {
    categories: cats.filter((c) => gap([c.name, c.tagline], c.review)).length,
    services: svc.filter((s) => gap([s.name], s.review)).length,
    projects: projs.filter((p) => gap([p.title, p.summary], p.review)).length,
    team: team.filter((m) => gap([m.name, m.role], m.review)).length,
    pages: pages.filter((s) => (s.value as { arNeedsReview?: boolean }).arNeedsReview).length,
  };
}

export default async function OverviewPage() {
  const user = await requireAdminPage();
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: "admin" });
  const format = await getFormatter({ locale });
  await connection();
  const now = new Date();
  const scope = await getMessageScope(user);
  const showMessages = Boolean(scope);

  const [[published], [drafts], [catCount], [teamCount], newMessages, messages, activity, gaps] = await Promise.all([
    db.select({ value: count() }).from(projects).where(eq(projects.status, "published")),
    db.select({ value: count() }).from(projects).where(eq(projects.status, "draft")),
    db.select({ value: count() }).from(categories),
    db.select({ value: count() }).from(teamMembers),
    countNewMessages(scope),
    scope
      ? db
          .select()
          .from(contactSubmissions)
          .where(scopeWhere(scope))
          .orderBy(desc(contactSubmissions.createdAt))
          .limit(5)
      : Promise.resolve([]),
    db
      .select({ id: auditLog.id, action: auditLog.action, createdAt: auditLog.createdAt, actor: userTable.name })
      .from(auditLog)
      .leftJoin(userTable, eq(userTable.id, auditLog.actorId))
      .orderBy(desc(auditLog.createdAt))
      .limit(8),
    translationGaps(),
  ]);
  const totalGaps = Object.values(gaps).reduce((a, b) => a + b, 0);

  type StatKey = "published" | "drafts" | "categories" | "team" | "messages";
  const stats: { key: StatKey; value: number; href: string }[] = [
    { key: "published", value: published.value, href: "/admin/projects" },
    { key: "drafts", value: drafts.value, href: "/admin/projects" },
    { key: "categories", value: catCount.value, href: "/admin/categories" },
    { key: "team", value: teamCount.value, href: "/admin/team" },
    ...(showMessages ? [{ key: "messages" as const, value: newMessages, href: "/admin/messages" }] : []),
  ];

  const quick = [
    can(user, "create", "projects") && { href: "/admin/projects", label: t("overview.newProject") },
    can(user, "create", "media") && { href: "/admin/media", label: t("overview.uploadMedia") },
    can(user, "edit", "pages") && { href: "/admin/pages/hero", label: t("overview.editHero") },
    showMessages && { href: "/admin/messages", label: t("overview.openInbox") },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <>
      <PageHeader label={t("overview.label")} title={t("overview.welcome", { name: user.name })} />

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <li key={stat.key}>
            <Link href={stat.href} className="bg-surface border-line hover:border-line-strong block border p-5">
              <span className="type-label text-label block">{t(`overview.stats.${stat.key}`)}</span>
              <span className="text-foreground mt-3 block font-mono text-4xl tabular-nums">
                <bdi>{stat.value}</bdi>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        {showMessages ? (
          <section className="bg-surface border-line border p-5 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="type-h4 text-foreground">{t("overview.recentMessages")}</h2>
              <Link href="/admin/messages" className="text-sm underline underline-offset-4">
                {t("overview.viewAll")}
              </Link>
            </div>
            {messages.length ? (
              <ul className="divide-line mt-4 divide-y">
                {messages.map((m) => (
                  <li key={m.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                    <span className="min-w-0">
                      <span className={m.status === "new" ? "text-foreground font-bold" : "text-foreground"}>
                        {m.name}
                      </span>
                      <span className="text-muted block truncate" dir="auto">
                        {m.message}
                      </span>
                    </span>
                    <span className="type-data text-muted shrink-0 text-xs">
                      {format.relativeTime(m.createdAt, now)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-4 text-sm">{t("overview.noMessages")}</p>
            )}
          </section>
        ) : null}

        <section className="bg-surface border-line border p-5">
          <h2 className="type-h4 text-foreground">{t("overview.gaps")}</h2>
          <p className={`mt-2 text-sm ${totalGaps ? "text-warning font-semibold" : "text-success"}`}>
            {t("overview.gapsSummary", { count: totalGaps })}
          </p>
          {totalGaps ? (
            <ul className="mt-4 space-y-1 text-sm">
              {(Object.entries(gaps) as [keyof typeof gaps, number][])
                .filter(([, n]) => n > 0)
                .map(([key, n]) => (
                  <li key={key} className="flex justify-between">
                    <Link
                      href={
                        key === "pages"
                          ? "/admin/pages/home"
                          : key === "services"
                            ? "/admin/categories"
                            : `/admin/${key}`
                      }
                      className="underline underline-offset-4"
                    >
                      {t(`overview.gapTypes.${key}`)}
                    </Link>
                    <span className="type-data">
                      <bdi>{n}</bdi>
                    </span>
                  </li>
                ))}
            </ul>
          ) : null}
        </section>

        <section className="bg-surface border-line border p-5 xl:col-span-2">
          <h2 className="type-h4 text-foreground">{t("overview.activity")}</h2>
          {activity.length ? (
            <ul className="divide-line mt-4 divide-y">
              {activity.map((a) => (
                <li key={a.id} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                  <span>
                    <span className="text-foreground">{a.actor ?? t("audit.system")}</span>{" "}
                    <span className="type-data text-muted" dir="ltr">
                      {a.action}
                    </span>
                  </span>
                  <span className="type-data text-muted shrink-0 text-xs">{format.relativeTime(a.createdAt, now)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mt-4 text-sm">{t("overview.noActivity")}</p>
          )}
        </section>

        {quick.length ? (
          <section className="bg-surface border-line border p-5">
            <h2 className="type-h4 text-foreground">{t("overview.quick")}</h2>
            <ul className="mt-4 space-y-2">
              {quick.map((q) => (
                <li key={q.href + q.label}>
                  <Link
                    href={q.href}
                    className="border-line-strong hover:bg-foreground hover:text-background flex min-h-11 items-center border px-4 text-sm font-semibold"
                  >
                    {q.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
