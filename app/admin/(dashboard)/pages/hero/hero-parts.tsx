"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { SortableList } from "@/components/admin/sortable-list";
import { uiIcon } from "@/components/admin/ui-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { generateFrameSequence } from "@/lib/hero/browser";
import type { MediaItem } from "@/lib/media/types";
import type { HeroConfig } from "@/lib/settings/schemas";
import { registerFrameSequence } from "./actions";
import type { Sequence } from "./hero-preview";

type Beat = HeroConfig["beats"][number];

/** Click-to-set focal point over a poster. */
export function FocalPicker({
  label,
  image,
  value,
  onChange,
  hint,
}: {
  label: string;
  image: MediaItem | null;
  value: { x: number; y: number };
  onChange: (v: { x: number; y: number }) => void;
  hint: string;
}) {
  if (!image) return null;
  return (
    <div className="space-y-2">
      <p className="text-foreground text-sm font-semibold">{label}</p>
      <button
        type="button"
        className="relative block w-full max-w-sm cursor-crosshair"
        aria-label={`${label}: ${Math.round(value.x * 100)}%, ${Math.round(value.y * 100)}%`}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onChange({
            x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
            y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
          });
        }}
        onKeyDown={(event) => {
          const step = 0.05;
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step],
          };
          const move = moves[event.key];
          if (!move) return;
          event.preventDefault();
          onChange({ x: Math.min(1, Math.max(0, value.x + move[0])), y: Math.min(1, Math.max(0, value.y + move[1])) });
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="" className="block w-full" />
        <span
          aria-hidden
          className="bg-accent absolute size-3 -translate-x-1/2 -translate-y-1/2 outline-2 outline-(--palette-white)"
          style={{ left: `${value.x * 100}%`, top: `${value.y * 100}%` }}
        />
      </button>
      <p className="text-muted text-sm">{hint}</p>
    </div>
  );
}

const DESKTOP_WIDTHS = [1280, 1600, 1920];
const MOBILE_WIDTHS = [720, 1080];

/** In-browser frame-sequence generation for one variant. */
export function FramePanel({
  variant,
  video,
  sequence,
  trim,
  onGenerated,
  disabled,
}: {
  variant: "desktop" | "mobile";
  video: MediaItem | null;
  sequence: Sequence | null;
  trim: HeroConfig["trim"];
  onGenerated: (sequence: Sequence) => void;
  disabled: boolean;
}) {
  const t = useTranslations("admin.hero");
  const widths = variant === "desktop" ? DESKTOP_WIDTHS : MOBILE_WIDTHS;
  const [fps, setFps] = useState(24);
  const [width, setWidth] = useState(widths[variant === "desktop" ? 1 : 0]);
  const [quality, setQuality] = useState(0.8);
  const [progress, setProgress] = useState<{ phase: "encode" | "upload"; done: number; total: number } | null>(null);

  const generate = async () => {
    if (!video) {
      toast.error(t("needVideo"));
      return;
    }
    try {
      const sequenceId = crypto.randomUUID();
      const result = await generateFrameSequence({
        videoUrl: video.url,
        sequenceId,
        fps,
        width,
        quality,
        trim,
        onProgress: (phase, done, total) => setProgress({ phase, done, total }),
      });
      const saved = await registerFrameSequence({
        sourceMediaId: video.id,
        variant,
        basePath: `hero/frames/${sequenceId}/`,
        baseUrl: result.baseUrl,
        frameCount: result.frameCount,
        fps,
        width: result.width,
        height: result.height,
      });
      if (!saved.ok) throw new Error(saved.error);
      onGenerated(saved.data);
    } catch {
      toast.error(t("framesFailed"));
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="border-line space-y-3 border p-4">
      <p className="text-foreground text-sm font-semibold">
        {variant === "desktop" ? t("generateDesktop") : t("generateMobile")}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t("fps")}</span>
          <Input
            type="number"
            min={12}
            max={30}
            value={fps}
            onChange={(e) => setFps(Math.min(30, Math.max(12, Number(e.target.value) || 24)))}
            dir="ltr"
          />
        </label>
        <div className="space-y-1 text-sm">
          <span className="text-muted">{t("width")}</span>
          <Select value={String(width)} onValueChange={(v) => setWidth(Number(v))}>
            <SelectTrigger aria-label={t("width")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {widths.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  {w}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t("quality")}</span>
          <Input
            type="number"
            min={0.4}
            max={0.95}
            step={0.05}
            value={quality}
            onChange={(e) => setQuality(Math.min(0.95, Math.max(0.4, Number(e.target.value) || 0.8)))}
            dir="ltr"
          />
        </label>
      </div>
      {progress ? (
        <div role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
          <div className="bg-line h-1">
            <div className="bg-accent h-1" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p className="type-data text-muted mt-1 text-xs">
            {t(progress.phase === "encode" ? "generating" : "uploadingFrames", {
              done: progress.done,
              total: progress.total,
            })}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={generate} disabled={disabled}>
            {sequence ? t("regenerate") : variant === "desktop" ? t("generateDesktop") : t("generateMobile")}
          </Button>
          <span className="type-data text-muted text-xs">
            {sequence
              ? t("framesReady", { count: sequence.frameCount, fps: sequence.fps, width: sequence.width })
              : t("noFrames")}
          </span>
        </div>
      )}
    </div>
  );
}

const emptyBeat = (): Beat => ({
  id: crypto.randomUUID(),
  text: { en: "", ar: "" },
  style: "h2",
  position: { inline: "start", block: "bottom" },
  from: 0,
  to: 30,
  visible: true,
});

/** Repeatable, reorderable text beats. */
export function BeatsEditor({
  beats,
  onChange,
  disabled,
}: {
  beats: Beat[];
  onChange: (beats: Beat[]) => void;
  disabled: boolean;
}) {
  const t = useTranslations("admin.hero");
  const tActions = useTranslations("admin.actions");
  const update = (id: string, patch: Partial<Beat>) =>
    onChange(beats.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  return (
    <div className="space-y-3">
      {beats.length ? (
        <SortableList
          items={beats}
          onReorder={(next) => onChange(next)}
          disabled={disabled}
          renderItem={(beat, index) => (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="type-label text-label">
                  {t("beat")} <bdi>{String(index + 1).padStart(2, "0")}</bdi>
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={beat.visible}
                    onCheckedChange={(visible) => update(beat.id, { visible })}
                    aria-label={`${t("beat")} ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={tActions("remove")}
                    onClick={() => onChange(beats.filter((b) => b.id !== beat.id))}
                  >
                    <Trash2 {...uiIcon} size={14} />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={beat.text.en}
                  placeholder={`${t("beatText")} (EN)`}
                  dir="ltr"
                  onChange={(e) => update(beat.id, { text: { ...beat.text, en: e.target.value } })}
                />
                <Input
                  value={beat.text.ar}
                  placeholder={`${t("beatText")} (AR)`}
                  dir="rtl"
                  lang="ar"
                  onChange={(e) => update(beat.id, { text: { ...beat.text, ar: e.target.value } })}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-5">
                <Select
                  value={beat.style}
                  onValueChange={(style) => update(beat.id, { style: style as Beat["style"] })}
                >
                  <SelectTrigger aria-label={t("beatStyle")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["label", "display", "h2", "body"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`beatStyles.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={beat.position.inline}
                  onValueChange={(inline) =>
                    update(beat.id, { position: { ...beat.position, inline: inline as Beat["position"]["inline"] } })
                  }
                >
                  <SelectTrigger aria-label={t("beatInline")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["start", "center", "end"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`inline.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={beat.position.block}
                  onValueChange={(block) =>
                    update(beat.id, { position: { ...beat.position, block: block as Beat["position"]["block"] } })
                  }
                >
                  <SelectTrigger aria-label={t("beatBlock")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["top", "middle", "bottom"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`block.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={beat.from}
                  aria-label={t("from")}
                  dir="ltr"
                  onChange={(e) => update(beat.id, { from: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={beat.to}
                  aria-label={t("to")}
                  dir="ltr"
                  onChange={(e) => update(beat.id, { to: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                />
              </div>
            </div>
          )}
        />
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...beats, emptyBeat()])}
      >
        <Plus {...uiIcon} size={14} />
        {t("addBeat")}
      </Button>
    </div>
  );
}

const ENCODE_COMMANDS = `# Desktop MP4 — every frame a keyframe for perfect scrubbing
ffmpeg -i input.mov -an -vf "scale=1920:-2,fps=30" -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 23 -g 1 -movflags +faststart hero-desktop.mp4

# Desktop WebM (optional, smaller in Chrome/Firefox)
ffmpeg -i input.mov -an -vf "scale=1920:-2,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 34 -g 1 -row-mt 1 hero-desktop.webm

# Mobile portrait MP4
ffmpeg -i input-portrait.mov -an -vf "scale=1080:-2,fps=30" -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 25 -g 1 -movflags +faststart hero-mobile.mp4`;

export function EncodeHelp() {
  const t = useTranslations("admin.hero.help");
  return (
    <details className="border-line border px-4 py-3 text-sm">
      <summary className="text-foreground cursor-pointer font-semibold">{t("title")}</summary>
      <p className="text-muted mt-2">{t("intro")}</p>
      <pre dir="ltr" className="bg-inverse text-on-inverse type-data mt-3 overflow-x-auto p-3 text-xs whitespace-pre">
        {ENCODE_COMMANDS}
      </pre>
      <p className="text-muted mt-3">{t("note")}</p>
    </details>
  );
}
