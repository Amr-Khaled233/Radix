"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type HeaderShellProps = {
  logoFull: ReactNode;
  logoCompact: ReactNode;
  children: ReactNode;
  mobileControls: ReactNode;
};

/**
 * Fixed header with a constant in-flow spacer (no layout shift).
 * At the top of the page the full horizontal lockup shows with its clear
 * space (120 px band). After scrolling, the header compacts to 72 px and the
 * icon signs off for the lockup — the logo only ever fades as a whole.
 */
export function HeaderShell({ logoFull, logoCompact, children, mobileControls }: HeaderShellProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute top-0 h-12 w-px" />
      <div aria-hidden className="h-16 nav:h-[120px]" />
      <header
        data-compact={compact || undefined}
        className={cn(
          "bg-background fixed inset-x-0 top-0 z-40 border-b transition-[height,border-color] duration-(--duration-hover) ease-brand",
          "h-16 nav:h-[120px] nav:data-compact:h-[72px]",
          compact ? "border-line" : "border-transparent",
        )}
      >
        <div className="container-site flex h-full items-center justify-between gap-6">
          <div className="relative flex h-full items-center">
            <div
              className={cn(
                "hidden transition-opacity duration-(--duration-hover) ease-brand nav:block",
                compact && "nav:pointer-events-none nav:opacity-0",
              )}
            >
              {logoFull}
            </div>
            <div
              className={cn(
                "transition-opacity duration-(--duration-hover) ease-brand nav:absolute nav:inset-s-0 nav:top-1/2 nav:-translate-y-1/2",
                !compact && "nav:pointer-events-none nav:opacity-0",
              )}
            >
              {logoCompact}
            </div>
          </div>
          <div className="hidden items-center gap-6 nav:flex">{children}</div>
          <div className="flex items-center nav:hidden">{mobileControls}</div>
        </div>
      </header>
    </>
  );
}
