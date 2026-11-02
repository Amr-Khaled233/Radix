"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";
import { registerMedia } from "@/app/admin/(dashboard)/media/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { IMAGE_TYPES } from "@/lib/media/config";
import type { MediaItem } from "@/lib/media/types";
import { uploadFile, UploadError } from "@/lib/media/upload-client";
import { uiIcon } from "../ui-icon";
import { MediaPicker } from "./media-picker";

/** Draws the cropped square to a canvas and exports WebP (max 1200 px). */
async function cropToWebp(src: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const size = Math.min(1200, Math.round(area.width));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d")!.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop"))), "image/webp", 0.9),
  );
}

type PhotoCropFieldProps = {
  label: string;
  hint?: string;
  value: MediaItem | null;
  alt: { en: string; ar: string };
  onChange: (item: MediaItem | null) => void;
};

/** Square team photo: pick from the library, or upload and crop a new one. */
export function PhotoCropField({ label, hint, value, alt, onChange }: PhotoCropFieldProps) {
  const t = useTranslations("admin");
  const inputId = useId();
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!source || !area) return;
    setBusy(true);
    try {
      const blob = await cropToWebp(source, area);
      const uploaded = await uploadFile(blob, { kind: "image", name: `team-${Date.now()}.webp` });
      const result = await registerMedia({
        ...uploaded,
        contentType: "image/webp",
        width: Math.min(1200, Math.round(area.width)),
        height: Math.min(1200, Math.round(area.width)),
        alt,
      });
      if (!result.ok) throw new UploadError("failed");
      onChange(result.data);
      setSource(null);
    } catch (error) {
      toast.error(t(`media.errors.${error instanceof UploadError ? error.code : "failed"}`));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <MediaPicker label={label} value={value} onChange={onChange} aspect="square" hint={hint} />
      <label
        htmlFor={inputId}
        className="text-foreground inline-flex cursor-pointer items-center gap-2 text-sm underline underline-offset-4"
      >
        <Upload {...uiIcon} size={14} />
        {t("team.uploadPhoto")}
        <input
          id={inputId}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setZoom(1);
            setCrop({ x: 0, y: 0 });
            setSource(URL.createObjectURL(file));
            event.target.value = "";
          }}
        />
      </label>

      <Dialog open={Boolean(source)} onOpenChange={(open) => !open && setSource(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("team.cropTitle")}</DialogTitle>
          </DialogHeader>
          <div className="bg-inverse relative aspect-square w-full">
            {source ? (
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setArea(pixels)}
                showGrid={false}
              />
            ) : null}
          </div>
          <label className="block space-y-2 text-sm">
            <span className="text-foreground font-semibold">{t("team.zoom")}</span>
            <Slider
              min={1}
              max={3}
              step={0.05}
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              aria-label={t("team.zoom")}
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSource(null)}>
              {t("actions.cancel")}
            </Button>
            <Button type="button" onClick={save} disabled={busy || !area}>
              {busy ? t("actions.saving") : t("team.useCrop")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
