"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/brand/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/cn";
import { previousPath } from "./route-memory";

type BackLinkProps = {
  /** The page to return to (without locale), e.g. "/services/brand". */
  href: string;
  /** A card on that page to land on (its element id) when the visitor did not come from there. */
  anchor?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Back to a listing page. Coming from that page, it steps back through the browser history, so the
 * visitor lands where they were (same scroll position). Otherwise (opened directly, or reached through
 * "next project") it opens the page at the card of the item they were looking at.
 */
export function BackLink({ href, anchor, children, className }: BackLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={anchor ? `${href}#${anchor}` : href}
      onClick={(event) => {
        const previous = previousPath();
        if (!previous?.endsWith(href) || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        router.back();
      }}
      className={cn(
        "type-label text-foreground hover:text-focus group inline-flex min-h-11 items-center gap-2 transition-colors duration-(--duration-hover)",
        className,
      )}
    >
      {/* The brand arrow, turned to point back (left in English, right in Arabic). */}
      <Icon
        name="arrow-right"
        size={18}
        className="transition-transform duration-(--duration-hover) ease-brand ltr:-scale-x-100 rtl:scale-x-100 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 motion-reduce:translate-none"
      />
      {children}
    </Link>
  );
}
