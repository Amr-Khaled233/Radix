"use client";

import { useTranslations } from "next-intl";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { HeroBeats } from "@/components/site/hero-beats";
import { Slider } from "@/components/ui/slider";
import { frameName, progressToFrame, progressToTime } from "@/lib/hero/math";
import type { Locale } from "@/lib/i18n/routing";
import type { MediaItem } from "@/lib/media/types";
import type { HeroConfig } from "@/lib/settings/schemas";
import { cn } from "@/lib/cn";

export type Sequence = { id: string; basePath: string; frameCount: number; fps: number; width: number; height: number };

export type PreviewHandle = { video: HTMLVideoElement | null };

type HeroPreviewProps = {
  config: HeroConfig;
  media: Map<string, MediaItem>;
  sequences: Map<string, Sequence>;
};

/** Dashboard preview: device/language switch and a slider standing in for scroll progress. */
export const HeroPreview = forwardRef<PreviewHandle, HeroPreviewProps>(function HeroPreview(
  { config, media, sequences },
  ref,
) {
  const t = useTranslations("admin.hero");
  const tLocale = useTranslations("admin.locale");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [locale, setLocale] = useState<Locale>("en");
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  useImperativeHandle(ref, () => ({ video: videoRef.current }), []);

  const pick = (id: string | null) => (id ? (media.get(id) ?? null) : null);
  const poster =
    device === "mobile"
      ? (pick(config.assets.posterMobile) ?? pick(config.assets.posterDesktop))
      : pick(config.assets.posterDesktop);
  const video =
    (locale === "ar" ? pick(config.assets.arVideo) : null) ??
    (device === "mobile"
      ? (pick(config.assets.mobileMp4) ?? pick(config.assets.desktopMp4))
      : pick(config.assets.desktopMp4));
  const sequence =
    config.mode === "frames"
      ? sequences.get((device === "mobile" ? config.frames.mobile : null) ?? config.frames.desktop ?? "")
      : undefined;
  const focal = device === "mobile" ? config.focal.mobile : config.focal.desktop;
  const objectPosition = `${focal.x * 100}% ${focal.y * 100}%`;
  const fitClass = config.fit === "cover" ? "object-cover" : "object-contain";

  useEffect(() => {
    const el = videoRef.current;
    if (!el || config.mode !== "scrub" || !Number.isFinite(el.duration)) return;
    el.currentTime = progressToTime(progress / 100, config.trim, el.duration);
  }, [progress, config.mode, config.trim, video?.url]);

  const frameUrl = sequence
    ? `${sequence.basePath}${frameName(progressToFrame(progress / 100, sequence.frameCount))}`
    : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={device}
          onChange={setDevice}
          options={[
            ["desktop", t("previewDesktop")],
            ["mobile", t("previewMobile")],
          ]}
        />
        <Segmented
          value={locale}
          onChange={setLocale}
          options={[
            ["en", tLocale("en")],
            ["ar", tLocale("ar")],
          ]}
        />
      </div>

      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        lang={locale}
        className={cn(
          "relative mx-auto overflow-hidden bg-(--palette-aubergine) [container-type:inline-size]",
          device === "desktop" ? "aspect-video w-full" : "aspect-[9/19.5] w-[260px]",
        )}
        style={{ ["--gutter" as string]: device === "desktop" ? "6%" : "8%" }}
      >
        {config.mode === "frames" && frameUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frameUrl}
            alt=""
            className={cn("absolute inset-0 size-full", fitClass)}
            style={{ objectPosition }}
          />
        ) : (config.mode === "scrub" || config.mode === "loop") && video ? (
          <video
            key={video.url}
            ref={videoRef}
            src={video.url}
            poster={poster?.url}
            crossOrigin="anonymous"
            muted
            playsInline
            preload="auto"
            loop={config.mode === "loop"}
            autoPlay={config.mode === "loop"}
            className={cn("absolute inset-0 size-full", fitClass)}
            style={{ objectPosition }}
          />
        ) : poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster.url}
            alt=""
            className={cn("absolute inset-0 size-full", fitClass)}
            style={{ objectPosition }}
          />
        ) : (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-(--palette-lavender)">
            {t("previewEmpty")}
          </p>
        )}
        <div className="absolute inset-0 bg-(--palette-aubergine)" style={{ opacity: config.overlayOpacity / 100 }} />
        <HeroBeats beats={config.beats} locale={locale} progress={config.mode === "static" ? null : progress} compact />
        {config.toggles.exitSurfaceLine && progress > 92 ? (
          <div
            className="absolute inset-x-0 bottom-[8%] h-0.5 bg-(--palette-ivory)"
            style={{ transform: `scaleX(${(progress - 92) / 8})`, transformOrigin: locale === "ar" ? "right" : "left" }}
          />
        ) : null}
        {config.toggles.scrollHint && progress < 8 ? (
          <span className="type-label absolute bottom-[4%] left-1/2 -translate-x-1/2 text-(--palette-lavender)">
            SCROLL
          </span>
        ) : null}
      </div>

      <label className="block space-y-2">
        <span className="type-label text-label">{t("previewProgress", { percent: progress })}</span>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[progress]}
          onValueChange={([v]) => setProgress(v)}
          aria-label={t("previewProgress", { percent: progress })}
        />
      </label>
    </div>
  );
});

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="border-line flex border" role="group">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "px-3 py-1.5 text-sm font-semibold",
            value === key ? "bg-inverse text-on-inverse" : "text-muted",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
