"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Icon, type IconName } from "@/components/brand/icon";
import { formatIndex } from "@/components/brand/index-marker";
import { TextInput } from "@/components/admin/fields";
import { CompletenessBadge, type Completeness } from "@/components/admin/locale-tabs";
import { SortableList } from "@/components/admin/sortable-list";
import { uiIcon } from "@/components/admin/ui-icon";
import { useAction } from "@/components/admin/use-action";
import { useSyncedState } from "@/components/admin/use-synced-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { categoryCreateSchema } from "@/lib/admin/schemas";
import type { Locale } from "@/lib/i18n/routing";
import { t as localized, type Localized } from "@/lib/localized";
import { slugify } from "@/lib/slug";
import { createCategory, reorderCategories, toggleCategory } from "./actions";

type CategoryItem = {
  id: string;
  slug: string;
  name: Localized;
  iconKey: string;
  isVisible: boolean;
  showInNav: boolean;
  showOnHome: boolean;
  arNeedsReview: boolean;
  completeness: Completeness;
  services: number;
  projects: number;
};

type Flag = "isVisible" | "showInNav" | "showOnHome";

export function CategoryList({
  items,
  canReorder,
  canToggle,
}: {
  items: CategoryItem[];
  canReorder: boolean;
  canToggle: boolean;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const { run } = useAction();
  const [list, setList] = useSyncedState(items);

  const reorder = (next: CategoryItem[]) => {
    const previous = list;
    setList(next);
    void run(() => reorderCategories(next.map((item) => item.id)), {
      success: "reordered",
      onError: () => setList(previous),
    });
  };

  const toggle = (item: CategoryItem, field: Flag, value: boolean) => {
    const previous = list;
    setList(list.map((row) => (row.id === item.id ? { ...row, [field]: value } : row)));
    void run(() => toggleCategory(item.id, field, value), { success: "updated", onError: () => setList(previous) });
  };

  if (!list.length)
    return <p className="border-line text-muted border border-dashed p-8 text-sm">{t("categories.empty")}</p>;

  return (
    <SortableList
      items={list}
      onReorder={reorder}
      disabled={!canReorder}
      renderItem={(item, index) => (
        <div className="flex flex-col gap-3 py-1 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="type-data text-muted w-6 shrink-0">
              <bdi>{formatIndex(index + 1)}</bdi>
            </span>
            <span className="text-foreground">
              <Icon name={item.iconKey as IconName} size={22} />
            </span>
            <div className="min-w-0">
              <Link href={`/admin/categories/${item.id}`} className="text-foreground font-semibold hover:underline">
                {localized(item.name, locale)}
              </Link>
              <p className="text-muted flex flex-wrap items-center gap-x-3 text-xs">
                <span dir="ltr">/{item.slug}</span>
                <span>{t("categories.services", { count: item.services })}</span>
                <span>{t("categories.projects", { count: item.projects })}</span>
                <CompletenessBadge value={item.completeness} needsReview={item.arNeedsReview} />
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            {(["isVisible", "showInNav", "showOnHome"] as const).map((field) => (
              <label key={field} className="text-muted flex items-center gap-2 text-xs">
                <Switch
                  checked={item[field]}
                  disabled={!canToggle}
                  onCheckedChange={(value) => toggle(item, field, value)}
                  aria-label={`${t(`fields.${field === "isVisible" ? "visible" : field}`)} — ${localized(item.name, locale)}`}
                />
                {t(`fields.${field === "isVisible" ? "visible" : field}`)}
              </label>
            ))}
            <Button asChild variant="ghost" size="icon-sm" aria-label={t("actions.edit")}>
              <Link href={`/admin/categories/${item.id}`}>
                <Pencil {...uiIcon} size={16} />
              </Link>
            </Button>
          </div>
        </div>
      )}
    />
  );
}

export function NewCategoryButton() {
  const t = useTranslations("admin");
  const router = useRouter();
  const { run, pending } = useAction();
  const [open, setOpen] = useState(false);
  const form = useForm<z.input<typeof categoryCreateSchema>>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: { slug: "", name: { en: "", ar: "" } },
  });
  const errors = form.formState.errors;

  const submit = form.handleSubmit((values) =>
    run(() => createCategory(values), {
      success: "created",
      onSuccess: ({ id }) => {
        setOpen(false);
        router.push(`/admin/categories/${id}`);
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus {...uiIcon} size={16} />
          {t("categories.new")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <DialogHeader>
            <DialogTitle>{t("categories.newTitle")}</DialogTitle>
          </DialogHeader>
          <TextInput
            label={t("categories.nameEn")}
            dir="ltr"
            error={errors.name?.en?.message && t(`validation.${errors.name.en.message}` as "validation.requiredEn")}
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
            error={errors.slug?.message && t(`validation.${errors.slug.message}` as "validation.slug")}
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
