"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HeroBeats } from "@/components/site/hero-beats";
import {
  beatState,
  clamp,
  frameLoadOrder,
  frameName,
  placeMedia,
  progressToFrame,
  progressToTime,
  smoothStep,
} from "@/lib/hero/math";
import type { Locale } from "@/lib/i18n/routing";
import type { FrameRef, MediaRef } from "@/lib/site/data";
import type { HeroConfig } from "@/lib/settings/schemas";
import { cn } from "@/lib/cn";

type HeroScrollProps = {
  config: HeroConfig;
  media: Record<string, MediaRef>;
  frames: Record<string, FrameRef>;
  locale: Locale;
  /** Server-rendered poster (LCP). */
  poster: ReactNode;
  labels: { scroll: string; skip: string };
  /** Id of the element right after the hero (Skip intro target). */
  afterId: string;
};

type Engine = "scrub" | "frames" | "loop" | "static";

/** Decides what this visitor gets: reduced motion, Save-Data and slow networks fall back. */
function chooseEngine(config: HeroConfig, hasMobileVideo: boolean): Engine {
  if (typeof window === "undefined") return "static";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  const slow = Boolean(connection?.saveData) || /(^|-)2g$|^3g$/.test(connection?.effectiveType ?? "");
  if (slow) return config.allowLoopOnSaveData && hasMobileVideo ? "loop" : "static";
  return config.mode;
}

/**
 * Scroll-driven hero: a tall section with a sticky full-viewport stage.
 * Native scroll only — progress through the section drives video time (or a
 * frame index); nothing intercepts wheel or touch input.
 */
export function HeroScroll({ config, media, frames, locale, poster, labels, afterId }: HeroScrollProps) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const beats = useRef(new Map<string, HTMLElement>());
  const [engine, setEngine] = useState<Engine>("static");
  const [mobile, setMobile] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  const pick = (id: string | null) => (id ? (media[id] ?? null) : null);
  const arVideo = locale === "ar" ? pick(config.assets.arVideo) : null;
  const desktopVideo = arVideo ?? pick(config.assets.desktopMp4);
  const mobileVideo = arVideo ?? pick(config.assets.mobileMp4);
  const video = mobile ? (mobileVideo ?? desktopVideo) : desktopVideo;
  const webm = !mobile && !arVideo ? pick(config.assets.desktopWebm) : null;
  const sequence =
    (mobile && config.frames.mobile ? frames[config.frames.mobile] : null) ??
    (config.frames.desktop ? frames[config.frames.desktop] : null);
  const focal = mobile ? config.focal.mobile : config.focal.desktop;

  // Choose the engine after first paint, so the poster (LCP) is never blocked.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    const idle = (window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200)))(() =>
      setEngine(chooseEngine(config, Boolean(config.assets.mobileMp4))),
    );
    return () => {
      mq.removeEventListener("change", update);
      if (window.cancelIdleCallback && typeof idle === "number") window.cancelIdleCallback(idle);
    };
  }, [config]);

  const effective: Engine =
    engine === "frames" && !sequence
      ? video
        ? "scrub"
        : "static"
      : (engine === "scrub" || engine === "loop") && !video
        ? "static"
        : engine;

  // Scroll → progress → media time / frame, with smoothing; paused off-screen.
  useEffect(() => {
    const el = section.current;
    if (!el || effective === "static" || effective === "loop") return;

    let raf = 0;
    let visible = true;
    let target = 0;
    let current = 0;
    // Intro autoplay plays to introTo on load and holds there until scroll passes it.
    const introTo = (config.introAutoplayTo ?? 0) / 100;
    let intro = introTo > 0 ? 0 : null;
    const images: (HTMLImageElement | null)[] = [];
    let lastFrame = -1;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const stageHeight = stage.current?.offsetHeight ?? window.innerHeight;
      const distance = el.offsetHeight - stageHeight;
      return distance > 0 ? clamp(-rect.top / distance) : 0;
    };

    const applyOverlays = (p: number) => {
      const percent = p * 100;
      for (const node of beats.current.values()) {
        const from = Number(node.dataset.beatFrom);
        const to = Number(node.dataset.beatTo);
        const state = beatState({ from, to }, percent);
        node.style.opacity = String(state.opacity);
        node.style.transform = `translate3d(0, ${state.offset}px, 0)`;
      }
      if (lineRef.current) lineRef.current.style.transform = `scaleX(${clamp((p - 0.9) / 0.1)})`;
      if (hintRef.current) hintRef.current.style.opacity = String(clamp(1 - p * 12));
    };

    // Frame sequence: load coarse-to-fine; draw the nearest loaded frame.
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    if (effective === "frames" && sequence) {
      for (const index of frameLoadOrder(sequence.frameCount)) {
        const img = new Image();
        img.decoding = "async";
        img.src = `${sequence.baseUrl}${frameName(index)}`;
        img.onload = () => {
          images[index] = img;
          if (index === 0) setMediaReady(true);
        };
      }
    }
    const drawFrame = (p: number) => {
      if (!sequence || !canvas || !ctx) return;
      const wanted = progressToFrame(p, sequence.frameCount);
      let index = wanted;
      for (let d = 0; d < sequence.frameCount && !images[index]; d++) {
        index = images[wanted - d] ? wanted - d : wanted + d;
      }
      const img = images[index];
      if (!img || index === lastFrame) return;
      lastFrame = index;
      const box = placeMedia(
        { width: img.naturalWidth, height: img.naturalHeight },
        { width: canvas.width, height: canvas.height },
        config.fit,
        focal,
      );
      ctx.drawImage(img, box.x, box.y, box.width, box.height);
    };

    const resize = () => {
      if (!canvas) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.offsetWidth * ratio);
      canvas.height = Math.round(canvas.offsetHeight * ratio);
      lastFrame = -1;
    };

    const tick = () => {
      const scrolled = measure();
      if (intro !== null) {
        intro = Math.min(introTo, intro + 0.006);
        if (scrolled > introTo) intro = null; // handed over to scroll
      }
      target = Math.max(scrolled, intro ?? 0);
      current = smoothStep(current, target, config.smoothing);
      applyOverlays(current);
      if (effective === "scrub") {
        const v = videoRef.current;
        if (v && Number.isFinite(v.duration) && v.readyState >= 1) {
          const time = progressToTime(current, config.trim, v.duration);
          if (Math.abs(v.currentTime - time) > 1 / 60) v.currentTime = time;
        }
      } else {
        drawFrame(current);
      }
      if (visible) raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(tick);
    });
    observer.observe(el);
    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [effective, sequence, config, focal]);

  const isStatic = effective === "static";
  const scrollLength = isStatic ? null : mobile ? config.scrollLength.mobile : config.scrollLength.desktop;

  return (
    <section
      ref={section}
      aria-label={labels.scroll}
      className="scope-dark relative"
      style={{ height: scrollLength ? `${scrollLength}vh` : undefined }}
    >
      <div
        ref={stage}
        className={cn(
          "relative overflow-hidden bg-(--palette-aubergine)",
          // Sits below the fixed header (64 px mobile, 72 px once compact on desktop).
          isStatic
            ? "min-h-[calc(100svh-4rem)] nav:min-h-[calc(100svh-120px)]"
            : "sticky top-16 h-[calc(100svh-4rem)] nav:top-[72px] nav:h-[calc(100svh-72px)]",
        )}
        style={{ ["--hero-focal" as string]: `${focal.x * 100}% ${focal.y * 100}%` }}
      >
        {poster}
        {effective === "scrub" || effective === "loop" ? (
          <video
            key={`${video?.url}-${effective}`}
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            aria-hidden
            tabIndex={-1}
            disablePictureInPicture
            autoPlay={effective === "loop"}
            loop={effective === "loop"}
            onLoadedData={() => setMediaReady(true)}
            onError={() => setEngine("static")}
            className={cn(
              "absolute inset-0 size-full transition-opacity duration-(--duration-reveal)",
              config.fit === "cover" ? "object-cover" : "object-contain",
              mediaReady ? "opacity-100" : "opacity-0",
            )}
            style={{ objectPosition: `${focal.x * 100}% ${focal.y * 100}%` }}
          >
            {webm ? <source src={webm.url} type="video/webm" /> : null}
            {video ? <source src={video.url} type={video.contentType} /> : null}
          </video>
        ) : null}
        {effective === "frames" ? (
          <canvas
            ref={canvasRef}
            aria-hidden
            className={cn(
              "absolute inset-0 size-full transition-opacity duration-(--duration-reveal)",
              mediaReady ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null}

        <div
          aria-hidden
          className="absolute inset-0 bg-(--palette-aubergine)"
          style={{ opacity: config.overlayOpacity / 100 }}
        />

        {isStatic ? (
          // Reduced motion / static: every beat in a normal stacked layout.
          <div className="container-site relative flex min-h-[inherit] flex-col justify-end gap-fib-21 pt-fib-89 pb-fib-89">
            {config.beats
              .filter((b) => b.visible && (b.text[locale] || b.text.en))
              .map((b) => (
                <p
                  key={b.id}
                  className={cn(
                    b.style === "label" && "type-label text-(--palette-lavender)",
                    b.style === "display" && "type-display text-(--palette-ivory)",
                    b.style === "h2" && "type-h2 text-(--palette-ivory)",
                    b.style === "body" && "type-body-lg max-w-xl text-(--palette-ivory)",
                  )}
                >
                  {b.text[locale] || b.text.en}
                </p>
              ))}
          </div>
        ) : (
          <HeroBeats
            beats={config.beats}
            locale={locale}
            progress={0}
            beatRef={(id, node) => {
              if (node) beats.current.set(id, node);
              else beats.current.delete(id);
            }}
          />
        )}

        {!isStatic && config.toggles.scrollHint ? (
          <div ref={hintRef} aria-hidden className="absolute inset-x-0 bottom-fib-34 flex flex-col items-center gap-2">
            <span className="type-label text-(--palette-lavender)">{labels.scroll}</span>
            <span className="bg-accent h-fib-34 w-px" />
          </div>
        ) : null}

        {!isStatic && config.toggles.skipLink ? (
          <a
            href={`#${afterId}`}
            className="type-label absolute inset-e-(--gutter) bottom-fib-34 text-(--palette-lavender) underline-offset-4 hover:text-(--palette-ivory) hover:underline"
          >
            {labels.skip}
          </a>
        ) : null}

        {config.toggles.exitSurfaceLine ? (
          <div
            ref={lineRef}
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-0.5 bg-(--palette-ivory) ltr:origin-left rtl:origin-right"
            style={{ transform: isStatic ? undefined : "scaleX(0)" }}
          />
        ) : null}
      </div>
    </section>
  );
}
