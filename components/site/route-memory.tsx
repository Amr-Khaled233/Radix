"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Remembers the previous page of this visit (client navigations only), so a "back" link can return
 * through the browser history — which brings back the scroll position — instead of opening the
 * page again at the top.
 */
let current: string | null = null;
let previous: string | null = null;

export function previousPath() {
  return previous;
}

export function RouteMemory() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === current) return;
    previous = current;
    current = pathname;
  }, [pathname]);
  return null;
}
