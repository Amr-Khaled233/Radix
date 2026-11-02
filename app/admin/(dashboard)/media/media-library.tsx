"use client";

import { Search, Upload } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { MediaThumb } from "@/components/admin/media/media-thumb";
import { Uploader } from "@/components/admin/media/uploader";
import { uiIcon } from "@/components/admin/ui-icon";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MediaUsage } from "@/lib/admin/media";
import { t as localized } from "@/lib/localized";
import type { Locale } from "@/lib/i18n/routing";
import { formatBytes } from "@/lib/media/config";
import type { MediaItem } from "@/lib/media/types";
import { cn } from "@/lib/cn";
import { deleteMedia, updateMediaAlt } from "./actions";

type MediaLibraryProps = {
  items: MediaItem[];
  usage: Record<string, MediaUsage[]>;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export function MediaLibrary({ items, usage, canUpload, canEdit, canDelete }: MediaLibraryProps) {
  const t = useTranslations("admin");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "image" | "video">("all");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (kind === "all" || item.kind === kind) &&
          `${item.pathname} ${item.alt.en} ${item.alt.ar}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, kind, query],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search
            {...uiIcon}
            size={16}
            className="text-muted pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("actions.search")}
            aria-label={t("actions.search")}
            className="ps-9"
          />
        </div>
        <div role="group" aria-label={t("actions.filter")} className="border-line flex border">
          {(["all", "image", "video"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={kind === key}
              onClick={() => setKind(key)}
              className={cn(
                "px-3 py-2 text-sm font-semibold",
                kind === key ? "bg-inverse text-on-inverse" : "text-muted",
              )}
            >
              {t(`media.${key === "all" ? "all" : key === "image" ? "images" : "videos"}`)}
            </button>
          ))}
        </div>
        {canUpload ? (
          <Button type="button" className="sm:ms-auto" onClick={() => setUploading(true)}>
            <Upload {...uiIcon} size={16} />
            {t("media.upload")}
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="border-line text-muted border border-dashed p-8 text-sm">
          {items.length ? t("empty.search") : t("media.empty")}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((item) => {
            const used = usage[item.id]?.length ?? 0;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="bg-surface border-line hover:border-accent group block w-full border text-start"
                >
                  <MediaThumb item={item} className="aspect-square w-full" />
                  <span className="block p-2">
                    <span className="text-foreground block truncate text-xs font-semibold" dir="ltr">
                      {item.pathname.split("/").pop()}
                    </span>
                    <span className="type-data text-muted block text-xs">
                      {formatBytes(item.size)} · {t("media.usedCount", { count: used })}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={uploading} onOpenChange={setUploading}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("media.uploadTitle")}</DialogTitle>
          </DialogHeader>
          <Uploader onUploaded={() => setUploading(false)} />
        </DialogContent>
      </Dialog>

      {selected ? (
        <MediaDetails
          key={selected.id}
          item={selected}
          usage={usage[selected.id] ?? []}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function MediaDetails({
  item,
  usage,
  canEdit,
  canDelete,
  onClose,
}: {
  item: MediaItem;
  usage: MediaUsage[];
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const { run, pending } = useAction();
  const [alt, setAlt] = useState(item.alt);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("media.details")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            {item.kind === "video" ? (
              <video src={item.url} controls muted className="w-full" />
            ) : (
              <MediaThumb item={item} fit="contain" className="max-h-80 w-full" />
            )}
            <dl className="type-data text-muted mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
              <dt>{t("media.type")}</dt>
              <dd dir="ltr">{item.contentType}</dd>
              <dt>{t("media.size")}</dt>
              <dd>{formatBytes(item.size)}</dd>
              {item.width && item.height ? (
                <>
                  <dt>{t("media.dimensions")}</dt>
                  <dd>
                    <bdi>
                      {item.width} × {item.height}
                    </bdi>
                  </dd>
                </>
              ) : null}
              {item.duration ? (
                <>
                  <dt>{t("media.duration")}</dt>
                  <dd>{item.duration.toFixed(1)} s</dd>
                </>
              ) : null}
              <dt>{t("media.uploaded")}</dt>
              <dd>{format.dateTime(new Date(item.createdAt), { dateStyle: "medium" })}</dd>
            </dl>
          </div>
          <div className="space-y-5">
            {item.kind === "image" ? (
              <div className="space-y-3">
                <label className="block space-y-1 text-sm">
                  <span className="text-foreground font-semibold">{t("media.altEn")}</span>
                  <Input
                    value={alt.en}
                    disabled={!canEdit}
                    onChange={(e) => setAlt({ ...alt, en: e.target.value })}
                    dir="ltr"
                    lang="en"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-foreground font-semibold">{t("media.altAr")}</span>
                  <Input
                    value={alt.ar}
                    disabled={!canEdit}
                    onChange={(e) => setAlt({ ...alt, ar: e.target.value })}
                    dir="rtl"
                    lang="ar"
                  />
                </label>
                {canEdit ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => updateMediaAlt(item.id, alt))}
                  >
                    {pending ? t("actions.saving") : t("actions.save")}
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div>
              <p className="type-label text-label mb-2">{t("media.used")}</p>
              {usage.length ? (
                <ul className="space-y-1 text-sm">
                  {usage.map((entry) => (
                    <li key={`${entry.kind}-${entry.href}`}>
                      <Link href={entry.href} className="text-foreground underline underline-offset-4">
                        {t(`media.usage.${entry.kind}`)}
                        {typeof entry.label === "object" ? ` — ${localized(entry.label, locale)}` : ""}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted text-sm">{t("media.unused")}</p>
              )}
            </div>

            {canDelete ? (
              usage.length ? (
                <p className="text-muted text-sm">{t("media.deleteBlocked")}</p>
              ) : (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="destructive" size="sm">
                      {t("actions.delete")}
                    </Button>
                  }
                  description={t("confirm.deleteBody", { name: item.pathname.split("/").pop() ?? "" })}
                  onConfirm={() => run(() => deleteMedia(item.id), { success: "deleted", onSuccess: onClose })}
                />
              )
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
