"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, ExternalLink, MoreHorizontal, Pencil, Plus, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "@/lib/zod";
import { DataTable, type AdminColumn } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { TextInput } from "@/components/admin/fields";
import { CompletenessBadge, type Completeness } from "@/components/admin/locale-tabs";
import { MediaThumb } from "@/components/admin/media/media-thumb";
import { uiIcon } from "@/components/admin/ui-icon";
import { useAction } from "@/components/admin/use-action";
import { useFieldError } from "@/components/admin/use-field-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requiredEn } from "@/lib/admin/schemas";
import type { Locale } from "@/lib/i18n/routing";
import { t as localized, type Localized } from "@/lib/localized";
import type { MediaItem } from "@/lib/media/types";
import { slugify, slugSchema } from "@/lib/slug";
import { createProject, duplicateProject, setProjectFeatured, setProjectStatus } from "./actions";

type Status = "draft" | "published" | "archived";

type ProjectRow = {
  id: string;
  slug: string;
  title: Localized;
  clientName: Localized;
  status: Status;
  isFeatured: boolean;
  year: number | null;
  updatedAt: string;
  cover: MediaItem | null;
  categoryIds: string[];
  completeness: Completeness;
  arNeedsReview: boolean;
};

const STATUS_TONE = { draft: "neutral", published: "success", archived: "warning" } as const;

export function ProjectTable({
  projects,
  categories,
  permissions,
}: {
  projects: ProjectRow[];
  categories: { id: string; name: Localized }[];
  permissions: { create: boolean; publish: boolean; delete: boolean };
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { run } = useAction();
  const [status, setStatus] = useState<Status | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.id, localized(c.name, locale)])),
    [categories, locale],
  );

  const data = projects.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      (category === "all" || p.categoryIds.includes(category)) &&
      (!featuredOnly || p.isFeatured),
  );

  const columns: AdminColumn<ProjectRow>[] = [
    {
      id: "project",
      header: t("projects.columns.project"),
      accessorFn: (row) => localized(row.title, locale),
      cell: ({ row: { original: p } }) => (
        <div className="flex items-center gap-3">
          <div className="border-line aspect-video w-20 shrink-0 border">
            {p.cover ? <MediaThumb item={p.cover} className="size-full" /> : null}
          </div>
          <div className="min-w-0">
            <Link href={`/admin/projects/${p.id}`} className="text-foreground font-semibold hover:underline">
              {localized(p.title, locale)}
            </Link>
            <div>
              <CompletenessBadge value={p.completeness} needsReview={p.arNeedsReview} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "client",
      header: t("projects.columns.client"),
      accessorFn: (row) => localized(row.clientName, locale),
      cell: ({ getValue }) => <span className="text-muted">{getValue() as string}</span>,
    },
    {
      id: "categories",
      header: t("projects.columns.categories"),
      enableSorting: false,
      cell: ({ row: { original: p } }) => (
        <span className="text-muted text-sm">
          {p.categoryIds
            .map((cid) => categoryName.get(cid))
            .filter(Boolean)
            .join(" · ")}
        </span>
      ),
    },
    {
      id: "status",
      header: t("projects.columns.status"),
      accessorFn: (row) => row.status,
      cell: ({ row: { original: p } }) => (
        <span className="flex items-center gap-2">
          <StatusBadge tone={STATUS_TONE[p.status]}>{t(`projects.status.${p.status}`)}</StatusBadge>
          {p.isFeatured ? <Star {...uiIcon} size={14} aria-label={t("projects.columns.featured")} /> : null}
        </span>
      ),
    },
    {
      id: "year",
      header: t("projects.columns.year"),
      accessorFn: (row) => row.year ?? 0,
      cell: ({ row: { original: p } }) => <span className="type-data">{p.year ?? "—"}</span>,
    },
    {
      id: "actions",
      header: t("table.actions"),
      enableSorting: false,
      cell: ({ row: { original: p } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t("actions.more")}>
              <MoreHorizontal {...uiIcon} size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/projects/${p.id}`}>
                <Pencil {...uiIcon} size={14} />
                {t("actions.edit")}
              </Link>
            </DropdownMenuItem>
            {p.status === "published" ? (
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/work/${p.slug}`} target="_blank">
                  <ExternalLink {...uiIcon} size={14} className="rtl:-scale-x-100" />
                  {t("projects.viewLive")}
                </Link>
              </DropdownMenuItem>
            ) : null}
            {permissions.create ? (
              <DropdownMenuItem
                onSelect={() =>
                  run(() => duplicateProject(p.id), {
                    success: "created",
                    onSuccess: ({ id }) => router.push(`/admin/projects/${id}`),
                  })
                }
              >
                <Copy {...uiIcon} size={14} />
                {t("projects.duplicate")}
              </DropdownMenuItem>
            ) : null}
            {permissions.publish ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => run(() => setProjectFeatured(p.id, !p.isFeatured), { success: "updated" })}
                >
                  <Star {...uiIcon} size={14} />
                  {t("projects.featured")}
                </DropdownMenuItem>
                {p.status !== "published" ? (
                  <DropdownMenuItem
                    onSelect={() => run(() => setProjectStatus(p.id, "published"), { success: "updated" })}
                  >
                    {t("projects.status.published")}
                  </DropdownMenuItem>
                ) : null}
                {p.status !== "archived" ? (
                  <DropdownMenuItem
                    onSelect={() => run(() => setProjectStatus(p.id, "archived"), { success: "updated" })}
                  >
                    {t("projects.archive")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => run(() => setProjectStatus(p.id, "draft"), { success: "updated" })}>
                    {t("projects.restore")}
                  </DropdownMenuItem>
                )}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchText={(p) => `${p.title.en} ${p.title.ar} ${p.clientName.en} ${p.clientName.ar} ${p.slug}`}
      empty={t("projects.empty")}
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as Status | "all")}>
            <SelectTrigger className="w-40" aria-label={t("projects.columns.status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("projects.allStatuses")}</SelectItem>
              {(["draft", "published", "archived"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`projects.status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44" aria-label={t("projects.columns.categories")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("projects.allCategories")}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {localized(c.name, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={featuredOnly ? "default" : "outline"}
            size="sm"
            aria-pressed={featuredOnly}
            onClick={() => setFeaturedOnly(!featuredOnly)}
          >
            <Star {...uiIcon} size={14} />
            {t("projects.featuredOnly")}
          </Button>
        </div>
      }
    />
  );
}

const createSchema = z.object({ slug: slugSchema, title: requiredEn });

export function NewProjectButton() {
  const t = useTranslations("admin");
  const fieldError = useFieldError();
  const router = useRouter();
  const { run, pending } = useAction();
  const [open, setOpen] = useState(false);
  const form = useForm<z.input<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { slug: "", title: { en: "", ar: "" } },
  });

  const submit = form.handleSubmit((values) =>
    run(() => createProject(values), {
      success: "created",
      onSuccess: ({ id }) => {
        setOpen(false);
        router.push(`/admin/projects/${id}`);
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus {...uiIcon} size={16} />
          {t("projects.new")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <DialogHeader>
            <DialogTitle>{t("projects.newTitle")}</DialogTitle>
          </DialogHeader>
          <TextInput
            label={t("projects.titleEn")}
            dir="ltr"
            error={fieldError(form.formState.errors.title?.en)}
            {...form.register("title.en", {
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
