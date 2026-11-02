"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "@/lib/zod";
import { TextInput } from "@/components/admin/fields";
import { CompletenessBadge, type Completeness } from "@/components/admin/locale-tabs";
import { MediaThumb } from "@/components/admin/media/media-thumb";
import { SortableList } from "@/components/admin/sortable-list";
import { uiIcon } from "@/components/admin/ui-icon";
import { useAction } from "@/components/admin/use-action";
import { useFieldError } from "@/components/admin/use-field-error";
import { useSyncedState } from "@/components/admin/use-synced-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { requiredEn } from "@/lib/admin/schemas";
import type { Locale } from "@/lib/i18n/routing";
import { t as localized, type Localized } from "@/lib/localized";
import type { MediaItem } from "@/lib/media/types";
import { slugify, slugSchema } from "@/lib/slug";
import { createTeamMember, reorderTeam, toggleTeamMember } from "./actions";

type MemberItem = {
  id: string;
  slug: string;
  name: Localized;
  role: Localized;
  isVisible: boolean;
  showOnHome: boolean;
  photo: MediaItem | null;
  completeness: Completeness;
  arNeedsReview: boolean;
};

export function TeamList({
  items,
  canReorder,
  canToggle,
}: {
  items: MemberItem[];
  canReorder: boolean;
  canToggle: boolean;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const { run } = useAction();
  const [list, setList] = useSyncedState(items);

  if (!list.length) return <p className="border-line text-muted border border-dashed p-8 text-sm">{t("team.empty")}</p>;

  const toggle = (item: MemberItem, field: "isVisible" | "showOnHome", value: boolean) => {
    const previous = list;
    setList(list.map((m) => (m.id === item.id ? { ...m, [field]: value } : m)));
    void run(() => toggleTeamMember(item.id, field, value), { success: "updated", onError: () => setList(previous) });
  };

  return (
    <SortableList
      items={list}
      disabled={!canReorder}
      onReorder={(next) => {
        const previous = list;
        setList(next);
        void run(() => reorderTeam(next.map((m) => m.id)), { success: "reordered", onError: () => setList(previous) });
      }}
      renderItem={(item) => (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="bg-background size-12 shrink-0">
              {item.photo ? <MediaThumb item={item.photo} className="size-12" /> : null}
            </div>
            <div className="min-w-0">
              <Link href={`/admin/team/${item.id}`} className="text-foreground font-semibold hover:underline">
                {localized(item.name, locale)}
              </Link>
              <p className="text-muted flex flex-wrap gap-x-3 text-xs">
                <span>{localized(item.role, locale)}</span>
                <CompletenessBadge value={item.completeness} needsReview={item.arNeedsReview} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {(["isVisible", "showOnHome"] as const).map((field) => (
              <label key={field} className="text-muted flex items-center gap-2 text-xs">
                <Switch
                  checked={item[field]}
                  disabled={!canToggle}
                  onCheckedChange={(value) => toggle(item, field, value)}
                  aria-label={`${t(field === "isVisible" ? "fields.visible" : "fields.showOnHome")} — ${localized(item.name, locale)}`}
                />
                {t(field === "isVisible" ? "fields.visible" : "fields.showOnHome")}
              </label>
            ))}
            <Button asChild variant="ghost" size="icon-sm" aria-label={t("actions.edit")}>
              <Link href={`/admin/team/${item.id}`}>
                <Pencil {...uiIcon} size={16} />
              </Link>
            </Button>
          </div>
        </div>
      )}
    />
  );
}

const createSchema = z.object({ slug: slugSchema, name: requiredEn });

export function NewTeamMemberButton() {
  const t = useTranslations("admin");
  const fieldError = useFieldError();
  const router = useRouter();
  const { run, pending } = useAction();
  const [open, setOpen] = useState(false);
  const form = useForm<z.input<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { slug: "", name: { en: "", ar: "" } },
  });

  const submit = form.handleSubmit((values) =>
    run(() => createTeamMember(values), {
      success: "created",
      onSuccess: ({ id }) => {
        setOpen(false);
        router.push(`/admin/team/${id}`);
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus {...uiIcon} size={16} />
          {t("team.new")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <DialogHeader>
            <DialogTitle>{t("team.newTitle")}</DialogTitle>
          </DialogHeader>
          <TextInput
            label={t("team.nameEn")}
            dir="ltr"
            error={fieldError(form.formState.errors.name?.en)}
            {...form.register("name.en", {
              onChange: (event) => {
                if (!form.getFieldState("slug").isDirty) form.setValue("slug", slugify(event.target.value));
              },
            })}
          />
          <TextInput
            label={t("fields.slug")}
            hint={t("fields.slugHint")}
            dir="ltr"
            error={fieldError(form.formState.errors.slug)}
            {...form.register("slug")}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("actions.saving") : t("actions.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
