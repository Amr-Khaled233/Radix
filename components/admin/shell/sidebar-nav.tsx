"use client";

import {
  FileText,
  FolderKanban,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem, NavKey } from "@/lib/admin/nav";
import { cn } from "@/lib/cn";
import { uiIcon } from "../ui-icon";

const ICONS: Partial<Record<NavKey, LucideIcon>> = {
  overview: LayoutGrid,
  categories: Layers,
  projects: FolderKanban,
  team: Users,
  pages: FileText,
  messages: Mail,
  media: ImageIcon,
  admins: ShieldCheck,
  settings: Settings,
  auditLog: ScrollText,
};

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarNavProps = {
  items: NavItem[];
  newMessages: number;
  onNavigate?: () => void;
};

export function SidebarNav({ items, newMessages, onNavigate }: SidebarNavProps) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("main")} className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.key];
        const sectionActive = item.children ? pathname.startsWith("/admin/pages") : isActive(pathname, item.href);
        return (
          <div key={item.key}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={!item.children && sectionActive ? "page" : undefined}
              className={cn(
                "type-button flex min-h-10 items-center gap-3 border-s-2 px-3 transition-colors duration-(--duration-ui)",
                sectionActive
                  ? "border-accent bg-background text-foreground"
                  : "text-muted hover:text-foreground border-transparent",
              )}
            >
              {Icon ? <Icon {...uiIcon} /> : null}
              <span className="flex-1">{t(item.key)}</span>
              {item.key === "messages" && newMessages > 0 ? (
                <span className="type-data bg-accent text-on-accent min-w-6 px-1.5 text-center text-xs">
                  {newMessages}
                </span>
              ) : null}
            </Link>
            {item.children && sectionActive ? (
              <div className="ms-[30px] mt-0.5 mb-1 flex flex-col border-s">
                {item.children.map((child) => {
                  const active = isActive(pathname, child.href);
                  return (
                    <Link
                      key={child.key}
                      href={child.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "-ms-px border-s-2 py-1.5 ps-4 text-sm transition-colors",
                        active
                          ? "border-accent text-foreground font-semibold"
                          : "text-muted hover:text-foreground border-transparent",
                      )}
                    >
                      {t(child.key)}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
