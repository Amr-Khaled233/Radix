import { count, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { getAdminLocale } from "@/lib/admin/locale";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { contactSubmissions } from "@/lib/db/schema";

export const instant = false;

export default async function DashboardLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdminPage();
  const locale = await getAdminLocale();
  const newMessages = can(user, "view", "messages")
    ? ((await db.select({ value: count() }).from(contactSubmissions).where(eq(contactSubmissions.status, "new")))[0]
        ?.value ?? 0)
    : 0;

  return (
    <AdminShell user={user} locale={locale} newMessages={newMessages}>
      {children}
    </AdminShell>
  );
}
