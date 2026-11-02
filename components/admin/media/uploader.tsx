"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { registerMedia } from "@/app/admin/(dashboard)/media/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IMAGE_TYPES, VIDEO_TYPES } from "@/lib/media/config";
import { readMediaMetadata, uploadFile, UploadError } from "@/lib/media/upload-client";
import type { MediaItem } from "@/lib/media/types";
import { uiIcon } from "../ui-icon";

type UploaderProps = {
  accept?: "image" | "video" | "any";
  onUploaded: (row: MediaItem) => void;
};

/** Guidance shown wherever images are uploaded (spec §2.8). */
export function ImageryGuidance() {
  const t = useTranslations("admin.media.guidance");
  return (
    <details className="border-line border px-4 py-3 text-sm">
      <summary className="text-foreground cursor-pointer font-semibold">{t("title")}</summary>
      <div className="text-muted mt-2 space-y-2">
        <p>{t("do")}</p>
        <p>{t("avoid")}</p>
        <p>{t("logo")}</p>
      </div>
    </details>
  );
}

export function Uploader({ accept = "any", onUploaded }: UploaderProps) {
  const t = useTranslations("admin.media");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState({ en: "", ar: "" });
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const types = accept === "image" ? IMAGE_TYPES : accept === "video" ? VIDEO_TYPES : [...IMAGE_TYPES, ...VIDEO_TYPES];
  const isImage = file?.type.startsWith("image/");

  const choose = (selected: File | undefined) => {
    if (!selected) return;
    if (!(types as readonly string[]).includes(selected.type)) {
      toast.error(t("errors.type"));
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const submit = async () => {
    if (!file) return;
    if (isImage && (!alt.en.trim() || !alt.ar.trim())) {
      toast.error(t("altRequired"));
      return;
    }
    try {
      setProgress(0);
      const [uploaded, meta] = await Promise.all([
        uploadFile(file, { kind: isImage ? "image" : "video", onProgress: setProgress }),
        readMediaMetadata(file),
      ]);
      const result = await registerMedia({
        ...uploaded,
        width: meta.width,
        height: meta.height,
        duration: meta.duration,
        alt,
      });
      if (!result.ok) throw new UploadError("failed");
      onUploaded(result.data);
      setFile(null);
      setPreview(null);
      setAlt({ en: "", ar: "" });
    } catch (error) {
      toast.error(t(`errors.${error instanceof UploadError ? error.code : "failed"}`));
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            choose(event.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-6 py-10 text-center ${
            dragOver ? "border-accent bg-background" : "border-line-strong"
          }`}
        >
          <Upload {...uiIcon} size={24} />
          <span className="text-foreground font-semibold">{t("drop")}</span>
          <span className="text-muted text-sm">{accept === "image" ? t("allowedImages") : t("allowed")}</span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={types.join(",")}
            className="sr-only"
            onChange={(event) => choose(event.target.files?.[0])}
          />
        </label>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          {preview ? (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <video src={preview} muted className="aspect-square w-full object-cover" />
            )
          ) : null}
          <div className="space-y-3">
            <p className="text-foreground text-sm font-semibold break-all" dir="ltr">
              {file.name}
            </p>
            {isImage ? (
              <>
                <label className="block space-y-1 text-sm">
                  <span className="text-foreground font-semibold">{t("altEn")}</span>
                  <Input value={alt.en} onChange={(e) => setAlt({ ...alt, en: e.target.value })} dir="ltr" lang="en" />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-foreground font-semibold">{t("altAr")}</span>
                  <Input value={alt.ar} onChange={(e) => setAlt({ ...alt, ar: e.target.value })} dir="rtl" lang="ar" />
                </label>
                <p className="text-muted text-xs">{t("altHint")}</p>
              </>
            ) : null}
            {progress !== null ? (
              <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                <div className="bg-line h-1">
                  <div className="bg-accent h-1 transition-[width]" style={{ width: `${progress}%` }} />
                </div>
                <p className="type-data text-muted mt-1 text-xs">{t("uploading", { percent: Math.round(progress) })}</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button type="button" onClick={submit}>
                  {t("upload")}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setFile(null)}>
                  {t("chooseFile")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {accept !== "video" ? <ImageryGuidance /> : null}
    </div>
  );
}
