"use client";

import { LogOut, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";
import { uiIcon } from "../ui-icon";

export function UserMenu({ name, email, roleLabel }: { name: string; email: string; roleLabel: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("nav.account")}
        className="bg-inverse text-on-inverse type-data inline-flex size-10 items-center justify-center text-sm"
      >
        <bdi>{initials}</bdi>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-foreground font-semibold">{name}</p>
          <p className="text-muted text-xs" dir="ltr">
            {email}
          </p>
          <p className="type-label text-label mt-1">{roleLabel}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/profile">
            <UserRound {...uiIcon} />
            {t("nav.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await authClient.signOut();
            router.replace("/admin/login");
            router.refresh();
          }}
        >
          <LogOut {...uiIcon} className="rtl:-scale-x-100" />
          {t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
