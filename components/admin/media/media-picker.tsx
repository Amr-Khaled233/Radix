"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { listMediaForPicker } from "@/app/admin/(dashboard)/media/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MediaItem } from "@/lib/media/types";
import { cn } from "@/lib/cn";
import { uiIcon } from "../ui-icon";
import { MediaThumb } from "./media-thumb";
import { Uploader } from "./uploader";

type MediaPickerProps = {
  label: string;
  value: MediaItem | null;
  onChange: (item: MediaItem | null) => void;
  accept?: "image" | "video";
  hint?: string;
  aspect?: "square" | "video";
};

/** Shows the selected file and opens a library/upload dialog to change it. */
export function MediaPicker({ label, value, onChange, accept = "image", hint, aspect = "video" }: MediaPickerProps) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [tab, setTab] = useState<"library" | "upload">("library");

  const openDialog = async () => {
    setOpen(true);
    const result = await listMediaForPicker(accept);
    setItems(result.ok ? result.data : []);
    setTab(result.ok && result.data.length === 0 ? "upload" : "library");
  };

  const pick = (item: MediaItem) => {
    onChange(item);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-foreground text-sm font-semibold">{label}</p>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "border-line relative w-40 shrink-0 border",
            aspect === "square" ? "aspect-square" : "aspect-video",
          )}
        >
          {value ? (
            <MediaThumb item={value} className="size-full" />
          ) : (
            <span className="text-muted flex size-full items-center justify-center px-2 text-center text-xs">
              {t("media.none")}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openDialog}>
            {value ? t("actions.replace") : t("actions.choose")}
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X {...uiIcon} size={14} />
              {t("actions.remove")}
            </Button>
          ) : null}
        </div>
      </div>
      {hint ? <p className="text-muted text-sm">{hint}</p> : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("media.pickTitle")}</DialogTitle>
          </DialogHeader>
          <div role="tablist" className="border-line flex border-b">
            {(["library", "upload"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm font-semibold",
                  tab === key ? "border-accent text-foreground" : "text-muted border-transparent",
                )}
              >
                {key === "library" ? t("media.pick") : t("media.upload")}
              </button>
            ))}
          </div>
          {tab === "library" ? (
            items === null ? (
              <p className="text-muted py-8 text-sm">{t("actions.saving")}</p>
            ) : items.length === 0 ? (
              <p className="text-muted py-8 text-sm">{t("media.empty")}</p>
            ) : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => pick(item)}
                      className={cn(
                        "border-line hover:border-accent block w-full border-2",
                        value?.id === item.id && "border-accent",
                      )}
                    >
                      <MediaThumb item={item} className="aspect-square w-full" />
                      <span className="sr-only">{item.alt.en || item.pathname}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <Uploader accept={accept} onUploaded={pick} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
