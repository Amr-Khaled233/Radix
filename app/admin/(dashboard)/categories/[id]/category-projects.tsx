"use client";

import { Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/admin/status-badge";
import { SortableList } from "@/components/admin/sortable-list";
import { uiIcon } from "@/components/admin/ui-icon";
import { useAction } from "@/components/admin/use-action";
import { useSyncedState } from "@/components/admin/use-synced-state";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { Locale } from "@/lib/i18n/routing";
import { t as localized, type Localized } from "@/lib/localized";
import {
  assignProjectToCategory,
  listAssignableProjects,
  removeProjectFromCategory,
  reorderCategoryProjects,
  setFeaturedInCategory,
} from "../actions";

type AssignedProject = {
  id: string;
  title: Localized;
  status: "draft" | "published" | "archived";
  isFeaturedInCategory: boolean;
};

export function CategoryProjects({
  categoryId,
  projects,
  canManage,
  canFeature,
}: {
  categoryId: string;
  projects: AssignedProject[];
  canManage: boolean;
  canFeature: boolean;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const { run } = useAction();
  const [list, setList] = useSyncedState(projects);
  const [options, setOptions] = useState<{ id: string; title: Localized }[] | null>(null);

  const loadOptions = async () => {
    const result = await listAssignableProjects(categoryId);
    setOptions(result.ok ? result.data : []);
  };

  return (
    <section className="bg-surface border-line border p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="type-h4 text-foreground">{t("categories.projectsTitle")}</h2>
          <p className="text-muted text-sm">{t("categories.projectsHint")}</p>
        </div>
        {canManage ? (
          <Popover onOpenChange={(open) => open && loadOptions()}>
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <Plus {...uiIcon} size={14} />
                {t("categories.addProject")}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-1">
              {options === null ? null : options.length === 0 ? (
                <p className="text-muted p-3 text-sm">{t("categories.noAssignable")}</p>
              ) : (
                <ul className="max-h-72 overflow-y-auto">
                  {options.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        className="hover:bg-background w-full px-3 py-2 text-start text-sm"
                        onClick={() => {
                          setOptions(options.filter((o) => o.id !== option.id));
                          void run(() => assignProjectToCategory(categoryId, option.id), { success: "updated" });
                        }}
                      >
                        {localized(option.title, locale)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      {list.length ? (
        <SortableList
          items={list}
          disabled={!canManage}
          onReorder={(next) => {
            const previous = list;
            setList(next);
            void run(
              () =>
                reorderCategoryProjects(
                  categoryId,
                  next.map((p) => p.id),
                ),
              {
                success: "reordered",
                onError: () => setList(previous),
              },
            );
          }}
          renderItem={(project) => (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="text-foreground text-sm font-semibold hover:underline"
                >
                  {localized(project.title, locale)}
                </Link>
                <div className="mt-0.5">
                  <StatusBadge tone={project.status === "published" ? "success" : "neutral"}>
                    {t(`projects.status.${project.status}`)}
                  </StatusBadge>
                </div>
              </div>
              <label className="text-muted flex items-center gap-2 text-xs">
                <Switch
                  checked={project.isFeaturedInCategory}
                  disabled={!canFeature}
                  aria-label={t("categories.featuredInCategory")}
                  onCheckedChange={(value) => {
                    setList(list.map((p) => (p.id === project.id ? { ...p, isFeaturedInCategory: value } : p)));
                    void run(() => setFeaturedInCategory(categoryId, project.id, value), { success: "updated" });
                  }}
                />
                {t("categories.featured")}
              </label>
              {canManage ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("actions.remove")}
                  onClick={() => {
                    setList(list.filter((p) => p.id !== project.id));
                    void run(() => removeProjectFromCategory(categoryId, project.id), { success: "updated" });
                  }}
                >
                  <X {...uiIcon} size={14} />
                </Button>
              ) : null}
            </div>
          )}
        />
      ) : (
        <p className="text-muted text-sm">{t("categories.noProjects")}</p>
      )}
    </section>
  );
}
