"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/brand/icon";
import { cn } from "@/lib/cn";

export type ZoomImage = { src: string; alt: string; width: number | null; height: number | null };
type Labels = { open: string; close: string; previous: string; next: string };

const ZoomContext = createContext<((index: number) => void) | null>(null);

/**
 * Full-screen viewer for a case study's images. Tap an image to open it; close with the × button, Esc,
 * or the phone's Back button (opening adds a history entry, so Back returns to the same place on the page).
 * Swipe or use the arrows to move between images.
 */
export function ZoomGallery({
  images,
  labels,
  children,
}: {
  images: ZoomImage[];
  labels: Labels;
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const touch = useRef<number | null>(null);
  const pushed = useRef(false);

  const open = useCallback((i: number) => {
    opener.current = document.activeElement as HTMLElement | null;
    setIndex(i);
    window.history.pushState({ radixZoom: true }, "");
    pushed.current = true;
  }, []);

  // Closing goes through history.back(), so Back on the phone and the × button behave the same.
  const close = useCallback(() => {
    if (pushed.current) window.history.back();
    else setIndex(null);
  }, []);

  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    const onPop = () => {
      pushed.current = false;
      setIndex(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (index === null) {
      opener.current?.focus({ preventScroll: true });
      return;
    }
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });
    const rtl = root.dir === "rtl";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(rtl ? -1 : 1);
      else if (event.key === "ArrowLeft") step(rtl ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, close, step]);

  const image = index === null ? null : images[index];
  return (
    <ZoomContext.Provider value={open}>
      {children}
      {image ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={image.alt}
          className="scope-dark bg-background text-foreground fixed inset-0 z-[100] flex flex-col"
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null || images.length < 2) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            touch.current = null;
            if (Math.abs(dx) < 50) return;
            const rtl = document.documentElement.dir === "rtl";
            step(dx < 0 !== rtl ? 1 : -1);
          }}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="type-label text-label tabular-nums" aria-live="polite">
              <bdi>
                {index! + 1} / {images.length}
              </bdi>
            </p>
            <button
              ref={closeButton}
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="hover:text-accent inline-flex size-12 items-center justify-center transition-colors"
            >
              <Icon name="close" size={28} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16">
            {/* eslint-disable-next-line @next/next/no-img-element -- the original file, at full size */}
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              width={image.width ?? undefined}
              height={image.height ?? undefined}
              className="block h-auto max-h-full w-auto max-w-full object-contain"
            />
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={labels.previous}
                  className="bg-background/80 hover:text-accent absolute inset-s-2 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center transition-colors sm:inline-flex"
                >
                  <Icon name="arrow-right" size={24} className="rotate-180 rtl:rotate-0" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={labels.next}
                  className="bg-background/80 hover:text-accent absolute inset-e-2 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center transition-colors sm:inline-flex"
                >
                  <Icon name="arrow-right" size={24} className="rtl:rotate-180" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </ZoomContext.Provider>
  );
}

/** Makes its child image open the viewer at `index`. */
export function ZoomTrigger({
  index,
  label,
  className,
  children,
}: {
  index: number;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const open = useContext(ZoomContext);
  return (
    <button
      type="button"
      onClick={() => open?.(index)}
      aria-label={label}
      className={cn("block w-full cursor-zoom-in text-start", className)}
    >
      {children}
    </button>
  );
}
