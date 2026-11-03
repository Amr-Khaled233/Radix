import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { navFor } from "@/lib/admin/nav";
import type { AdminUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/routing";
import { AdminLocaleToggle } from "../admin-locale-toggle";
import { uiIcon } from "../ui-icon";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

type AdminShellProps = {
  user: AdminUser;
  locale: Locale;
  newMessages: number;
  /** Whether this account has an inbox (super admin, or responsible for a pillar). */
  hasInbox: boolean;
  children: ReactNode;
};

/** Dashboard frame: sidebar on desktop, drawer on mobile, top bar with language/theme/account. */
export async function AdminShell({ user, locale, newMessages, hasInbox, children }: AdminShellProps) {
  const t = await getTranslations({ locale, namespace: "admin" });
  const items = navFor(user, { inbox: hasInbox });
  const logo = <Logo variant="horizontal" height={40} clearSpace={false} title="RADIX" />;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <a
        href="#admin-main"
        className="type-button bg-accent text-on-accent fixed inset-s-4 top-4 z-50 -translate-y-24 px-4 py-3 focus:translate-y-0"
      >
        {t("nav.skip")}
      </a>
      <aside className="bg-surface border-line sticky top-0 hidden h-dvh flex-col border-e p-4 lg:flex">
        <Link href="/admin" className="text-foreground mb-8 block px-3 pt-2" aria-label="RADIX">
          <Logo variant="icon" height={32} clearSpace={false} title={null} />
        </Link>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav items={items} newMessages={newMessages} />
        </div>
        <Link
          href={`/${locale}`}
          target="_blank"
          className="text-muted hover:text-foreground mt-4 flex items-center gap-2 px-3 py-2 text-sm"
        >
          <ExternalLink {...uiIcon} size={16} className="rtl:-scale-x-100" />
          {t("nav.viewSite")}
        </Link>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="bg-background/95 border-line sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b px-4 backdrop-blur-none sm:px-8">
          <div className="flex items-center gap-3">
            <MobileNav items={items} newMessages={newMessages} logo={logo} />
            <span className="type-label text-label hidden sm:inline">{t("nav.main")}</span>
          </div>
          <div className="flex items-center gap-1">
            <AdminLocaleToggle />
            <ThemeToggle />
            <UserMenu name={user.name} email={user.email} roleLabel={t(`roles.${user.role}`)} />
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className="flex-1 px-4 py-8 outline-none sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
