import { AdminShell } from "@/components/admin/shell/admin-shell";
import { getAdminLocale } from "@/lib/admin/locale";
import { requireAdminPage } from "@/lib/auth/session";
import { countNewMessages, getMessageScope } from "@/lib/messages/access";

export const instant = false;

export default async function DashboardLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdminPage();
  const locale = await getAdminLocale();
  const scope = await getMessageScope(user);
  const newMessages = await countNewMessages(scope);

  return (
    <AdminShell user={user} locale={locale} newMessages={newMessages} hasInbox={Boolean(scope)}>
      {children}
    </AdminShell>
  );
}
