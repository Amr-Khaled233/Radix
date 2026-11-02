"use client";

import { Camera, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { registerMedia } from "@/app/admin/(dashboard)/media/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormSection, Toggle } from "@/components/admin/fields";
import { ImageryGuidance } from "@/components/admin/media/uploader";
import { MediaPicker } from "@/components/admin/media/media-picker";
import { uiIcon } from "@/components/admin/ui-icon";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { brightColorOf, captureFrame, heroTextContrast } from "@/lib/hero/browser";
import { formatBytes, HERO_WARN_DESKTOP_BYTES, HERO_WARN_MOBILE_BYTES } from "@/lib/media/config";
import type { MediaItem } from "@/lib/media/types";
import { uploadFile } from "@/lib/media/upload-client";
import { HERO_MODES, type HeroConfig } from "@/lib/settings/schemas";
import { cn } from "@/lib/cn";
import { revertHero, saveHero } from "./actions";
import { BeatsEditor, EncodeHelp, FocalPicker, FramePanel } from "./hero-parts";
import { HeroPreview, type PreviewHandle, type Sequence } from "./hero-preview";

type AssetKey = keyof HeroConfig["assets"];

type HeroEditorProps = {
  initial: HeroConfig;
  hasPrevious: boolean;
  media: MediaItem[];
  sequences: Sequence[];
  canEdit: boolean;
};

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between text-sm">
        <span className="text-foreground font-semibold">{label}</span>
        <span className="type-data text-muted">
          <bdi>
            {value}
            {unit}
          </bdi>
        </span>
      </span>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        aria-label={label}
      />
      {hint ? <span className="text-muted block text-sm">{hint}</span> : null}
    </label>
  );
}

export function HeroEditor({
  initial,
  hasPrevious,
  media: initialMedia,
  sequences: initialSequences,
  canEdit,
}: HeroEditorProps) {
  const t = useTranslations("admin.hero");
  const tAdmin = useTranslations("admin");
  const { run, pending } = useAction();
  const [saved, setSaved] = useState(initial);
  const [config, setConfig] = useState(initial);
  const [media, setMedia] = useState(() => new Map(initialMedia.map((m) => [m.id, m])));
  const [sequences, setSequences] = useState(() => new Map(initialSequences.map((s) => [s.id, s])));
  const [previous, setPrevious] = useState(hasPrevious);
  const [bright, setBright] = useState<[number, number, number] | null>(null);
  const [capturing, setCapturing] = useState(false);
  const preview = useRef<PreviewHandle>(null);

  const dirty = JSON.stringify(config) !== JSON.stringify(saved);
  const set = <K extends keyof HeroConfig>(key: K, value: HeroConfig[K]) => setConfig((c) => ({ ...c, [key]: value }));
  const asset = (key: AssetKey) => (config.assets[key] ? (media.get(config.assets[key]!) ?? null) : null);
  const setAsset = (key: AssetKey, item: MediaItem | null) => {
    if (item) setMedia((m) => new Map(m).set(item.id, item));
    setConfig((c) => ({ ...c, assets: { ...c.assets, [key]: item?.id ?? null } }));
  };

  const posterDesktop = asset("posterDesktop");
  useEffect(() => {
    let active = true;
    if (posterDesktop) void brightColorOf(posterDesktop.url).then((c) => active && setBright(c));
    return () => {
      active = false;
    };
  }, [posterDesktop]);
  const contrast = heroTextContrast(bright, config.overlayOpacity);

  const warnings = useMemo(() => {
    const list: string[] = [];
    const desktop = asset("desktopMp4");
    const mobile = asset("mobileMp4");
    if (desktop && desktop.size > HERO_WARN_DESKTOP_BYTES)
      list.push(t("warnings.desktopSize", { size: formatBytes(desktop.size) }));
    if (mobile && mobile.size > HERO_WARN_MOBILE_BYTES)
      list.push(t("warnings.mobileSize", { size: formatBytes(mobile.size) }));
    if (desktop?.duration && (desktop.duration < 6 || desktop.duration > 15))
      list.push(t("warnings.duration", { seconds: desktop.duration.toFixed(1) }));
    if (desktop?.width && desktop.width > 1920) list.push(t("warnings.width", { width: desktop.width }));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.assets, media, t]);

  const needsPosters =
    config.enabled && config.mode !== "static" && (!config.assets.posterDesktop || !config.assets.posterMobile);

  const captureAsPoster = async (target: "posterDesktop" | "posterMobile") => {
    const video = preview.current?.video;
    if (!video || !video.videoWidth) {
      toast.error(t("needVideo"));
      return;
    }
    setCapturing(true);
    try {
      const { blob, width, height } = await captureFrame(video);
      const uploaded = await uploadFile(blob, { kind: "image", name: `hero-poster-${Date.now()}.webp` });
      const result = await registerMedia({
        ...uploaded,
        contentType: "image/webp",
        width,
        height,
        alt: { en: "", ar: "" },
      });
      if (result.ok) setAsset(target, result.data);
    } catch {
      toast.error(tAdmin("media.errors.failed"));
    } finally {
      setCapturing(false);
    }
  };

  const save = () =>
    run(() => saveHero(config), {
      onSuccess: (next) => {
        setSaved(next);
        setConfig(next);
        setPrevious(true);
      },
    });

  const sequenceOf = (id: string | null) => (id ? (sequences.get(id) ?? null) : null);
  const disabled = !canEdit;

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_520px]">
      <div className="space-y-6">
        <FormSection title={t("mode")}>
          <Toggle
            label={t("enabled")}
            hint={t("enabledHint")}
            checked={config.enabled}
            disabled={disabled}
            onCheckedChange={(v) => set("enabled", v)}
          />
          <div role="radiogroup" aria-label={t("mode")} className="grid gap-2 sm:grid-cols-2">
            {HERO_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={config.mode === mode}
                disabled={disabled}
                onClick={() => set("mode", mode)}
                className={cn(
                  "border p-3 text-start",
                  config.mode === mode
                    ? "border-accent bg-background border-2"
                    : "border-line hover:border-line-strong",
                )}
              >
                <span className="text-foreground block text-sm font-semibold">{t(`modes.${mode}`)}</span>
                <span className="text-muted block text-xs">{t(`modeHints.${mode}`)}</span>
              </button>
            ))}
          </div>
          {needsPosters ? (
            <p className="text-warning flex items-center gap-2 text-sm font-semibold">
              <TriangleAlert {...uiIcon} size={16} />
              {t("posterRequired")}
            </p>
          ) : null}
        </FormSection>

        <FormSection title={t("assets")}>
          <div className="grid gap-6 md:grid-cols-2">
            <MediaPicker
              label={t("desktopVideo")}
              accept="video"
              value={asset("desktopMp4")}
              onChange={(i) => setAsset("desktopMp4", i)}
            />
            <MediaPicker
              label={t("desktopWebm")}
              accept="video"
              value={asset("desktopWebm")}
              onChange={(i) => setAsset("desktopWebm", i)}
            />
            <MediaPicker
              label={t("mobileVideo")}
              accept="video"
              value={asset("mobileMp4")}
              onChange={(i) => setAsset("mobileMp4", i)}
            />
            <MediaPicker
              label={t("arVideo")}
              accept="video"
              hint={t("arVideoHint")}
              value={asset("arVideo")}
              onChange={(i) => setAsset("arVideo", i)}
            />
            {(["posterDesktop", "posterMobile"] as const).map((key) => (
              <div key={key} className="space-y-2">
                <MediaPicker
                  label={t(key)}
                  hint={t("posterHint")}
                  value={asset(key)}
                  onChange={(i) => setAsset(key, i)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={capturing || disabled}
                  onClick={() => captureAsPoster(key)}
                >
                  <Camera {...uiIcon} size={14} />
                  {capturing ? t("usingFrame") : t("useFrame")}
                </Button>
              </div>
            ))}
          </div>
          {warnings.length ? (
            <ul className="border-warning space-y-1 border-s-2 ps-4 text-sm">
              {warnings.map((w) => (
                <li key={w} className="text-warning">
                  {w}
                </li>
              ))}
            </ul>
          ) : null}
          <EncodeHelp />
          <ImageryGuidance />
        </FormSection>

        {config.mode === "frames" ? (
          <FormSection title={t("frames")} description={t("framesHint")}>
            <FramePanel
              variant="desktop"
              video={asset("desktopMp4")}
              sequence={sequenceOf(config.frames.desktop)}
              trim={config.trim}
              disabled={disabled}
              onGenerated={(s) => {
                setSequences((m) => new Map(m).set(s.id, s));
                set("frames", { ...config.frames, desktop: s.id });
              }}
            />
            <FramePanel
              variant="mobile"
              video={asset("mobileMp4") ?? asset("desktopMp4")}
              sequence={sequenceOf(config.frames.mobile)}
              trim={config.trim}
              disabled={disabled}
              onGenerated={(s) => {
                setSequences((m) => new Map(m).set(s.id, s));
                set("frames", { ...config.frames, mobile: s.id });
              }}
            />
          </FormSection>
        ) : null}

        <FormSection title={t("scroll")}>
          <RangeField
            label={t("scrollDesktop")}
            unit="vh"
            min={150}
            max={600}
            step={10}
            value={config.scrollLength.desktop}
            disabled={disabled}
            onChange={(v) => set("scrollLength", { ...config.scrollLength, desktop: v })}
          />
          <RangeField
            label={t("scrollMobile")}
            unit="vh"
            min={100}
            max={400}
            step={10}
            value={config.scrollLength.mobile}
            disabled={disabled}
            onChange={(v) => set("scrollLength", { ...config.scrollLength, mobile: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <RangeField
              label={`${t("trim")} — ${t("trimStart")}`}
              unit=" s"
              min={0}
              max={Math.max(1, Math.floor(asset("desktopMp4")?.duration ?? 30))}
              step={0.1}
              value={config.trim.start}
              disabled={disabled}
              onChange={(v) => set("trim", { ...config.trim, start: v })}
            />
            <RangeField
              label={`${t("trim")} — ${t("trimEnd")}`}
              unit=" s"
              min={0}
              max={Math.max(1, Math.floor(asset("desktopMp4")?.duration ?? 30))}
              step={0.1}
              value={config.trim.end ?? Math.floor(asset("desktopMp4")?.duration ?? 30)}
              disabled={disabled}
              onChange={(v) => set("trim", { ...config.trim, end: v })}
            />
          </div>
          <div className="space-y-2">
            <p className="text-foreground text-sm font-semibold">{t("intro")}</p>
            <Select
              value={config.introAutoplayTo === null ? "off" : String(config.introAutoplayTo)}
              disabled={disabled}
              onValueChange={(v) => set("introAutoplayTo", v === "off" ? null : Number(v))}
            >
              <SelectTrigger className="w-64" aria-label={t("intro")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">{t("introOff")}</SelectItem>
                {[5, 10, 15, 20, 30].map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {t("introTo", { percent: p })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <RangeField
            label={t("smoothing")}
            hint={t("smoothingHint")}
            min={0}
            max={1}
            step={0.05}
            value={config.smoothing}
            disabled={disabled}
            onChange={(v) => set("smoothing", v)}
          />
        </FormSection>

        <FormSection title={t("framing")}>
          <div className="space-y-2">
            <p className="text-foreground text-sm font-semibold">{t("fit")}</p>
            <Select value={config.fit} disabled={disabled} onValueChange={(v) => set("fit", v as HeroConfig["fit"])}>
              <SelectTrigger className="w-40" aria-label={t("fit")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">{t("cover")}</SelectItem>
                <SelectItem value="contain">{t("contain")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <FocalPicker
              label={t("focalDesktop")}
              hint={t("focalHint")}
              image={asset("posterDesktop")}
              value={config.focal.desktop}
              onChange={(v) => set("focal", { ...config.focal, desktop: v })}
            />
            <FocalPicker
              label={t("focalMobile")}
              hint={t("focalHint")}
              image={asset("posterMobile")}
              value={config.focal.mobile}
              onChange={(v) => set("focal", { ...config.focal, mobile: v })}
            />
          </div>
          <RangeField
            label={t("overlay")}
            unit="%"
            min={0}
            max={80}
            value={config.overlayOpacity}
            disabled={disabled}
            onChange={(v) => set("overlayOpacity", v)}
          />
          <p className={cn("type-data text-sm", contrast >= 4.5 ? "text-success" : "text-danger")} role="status">
            {t("contrast", { ratio: contrast.toFixed(1) })} — {contrast >= 4.5 ? t("contrastOk") : t("contrastLow")}
          </p>
        </FormSection>

        <FormSection title={t("beats")} description={t("beatsHint")}>
          <BeatsEditor beats={config.beats} disabled={disabled} onChange={(beats) => set("beats", beats)} />
        </FormSection>

        <FormSection title={t("controls")}>
          <Toggle
            label={t("scrollHint")}
            checked={config.toggles.scrollHint}
            disabled={disabled}
            onCheckedChange={(v) => set("toggles", { ...config.toggles, scrollHint: v })}
          />
          <Toggle
            label={t("skipLink")}
            checked={config.toggles.skipLink}
            disabled={disabled}
            onCheckedChange={(v) => set("toggles", { ...config.toggles, skipLink: v })}
          />
          <Toggle
            label={t("exitLine")}
            checked={config.toggles.exitSurfaceLine}
            disabled={disabled}
            onCheckedChange={(v) => set("toggles", { ...config.toggles, exitSurfaceLine: v })}
          />
          <Toggle
            label={t("allowLoopOnSaveData")}
            checked={config.allowLoopOnSaveData}
            disabled={disabled}
            onCheckedChange={(v) => set("allowLoopOnSaveData", v)}
          />
        </FormSection>
      </div>

      <div className="2xl:sticky 2xl:top-20 2xl:self-start">
        <FormSection title={t("preview")}>
          <HeroPreview ref={preview} config={config} media={media} sequences={sequences} />
        </FormSection>
      </div>

      {canEdit ? (
        <div className="bg-background/95 border-line sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t py-4 2xl:col-span-2">
          <Button type="button" onClick={save} disabled={pending || needsPosters}>
            {pending ? tAdmin("actions.saving") : tAdmin("actions.save")}
          </Button>
          {previous ? (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="outline">
                  {t("revert")}
                </Button>
              }
              description={t("revertBody")}
              destructive={false}
              confirmLabel={t("revert")}
              onConfirm={() =>
                run(() => revertHero(), {
                  success: false,
                  onSuccess: (restored) => {
                    toast.success(t("reverted"));
                    setSaved(restored);
                    setConfig(restored);
                  },
                })
              }
            />
          ) : (
            <span className="text-muted text-xs">{t("noPrevious")}</span>
          )}
          <UnsavedGuard dirty={dirty} />
        </div>
      ) : null}
    </div>
  );
}
