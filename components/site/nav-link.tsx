"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Link, usePathname } from "@/lib/i18n/navigation";

/** Header link with an accent underline that draws in on hover and marks the current section. */
export function HeaderLink({ href, className, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();
  const current = pathname === href;
  const inside = !current && pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      data-active={inside || undefined}
      className={cn("nav-underline", className)}
      {...props}
    />
  );
}
