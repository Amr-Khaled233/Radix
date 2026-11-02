"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavItem } from "@/lib/admin/nav";
import { uiIcon } from "../ui-icon";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav({ items, newMessages, logo }: { items: NavItem[]; newMessages: number; logo: ReactNode }) {
  const t = useTranslations("admin.nav");
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("openMenu")}
          className="border-line-strong inline-flex size-10 items-center justify-center border lg:hidden"
        >
          <Menu {...uiIcon} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-surface w-72 p-4 rtl:left-auto rtl:right-0">
        <SheetTitle className="sr-only">{t("main")}</SheetTitle>
        <div className="text-foreground mb-6">{logo}</div>
        <SidebarNav items={items} newMessages={newMessages} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
