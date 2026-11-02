"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { CompletenessBadge } from "@/components/admin/locale-tabs";
import { SortableList } from "@/components/admin/sortable-list";
import { uiIcon } from "@/components/admin/ui-icon";
import { useAction } from "@/components/admin/use-action";
import { useSyncedState } from "@/components/admin/use-synced-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { services } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/routing";
import { completeness, t as localized, type Localized } from "@/lib/localized";
import { createService, deleteService, reorderServices, toggleService, updateService } from "../actions";

type Service = typeof services.$inferSelect;
type Permissions = { create: boolean; reorder: boolean; toggle: boolean; delete: boolean };

export function ServicesManager({
  categoryId,
  services: initial,
  permissions,
}: {
  categoryId: string;
  services: Service[];
  permissions: Permissions;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const { run } = useAction();
  const [list, setList] = useSyncedState(initial);
  const [editing, setEditing] = useState<Service | "new" | null>(null);

  const reorder = (next: Service[]) => {
    const previous = list;
    setList(next);
    void run(
      () =>
        reorderServices(
          categoryId,
          next.map((s) => s.id),
        ),
      { success: "reordered", onError: () => setList(previous) },
    );
  };

  return (
    <section className="bg-surface border-line border p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="type-h4 text-foreground">{t("categories.servicesTitle")}</h2>
          <p className="text-muted text-sm">{t("categories.servicesHint")}</p>
        </div>
        {permissions.create ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus {...uiIcon} size={14} />
            {t("categories.addService")}
          </Button>
        ) : null}
      </div>

      {list.length ? (
        <SortableList
          items={list}
          onReorder={reorder}
          disabled={!permissions.reorder}
          renderItem={(service) => (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold ${service.isVisible ? "text-foreground" : "text-muted line-through"}`}
                >
                  {localized(service.name, locale)}
                </p>
                <CompletenessBadge value={completeness([service.name])} needsReview={service.arNeedsReview} />
              </div>
              <Switch
                checked={service.isVisible}
                disabled={!permissions.toggle}
                aria-label={`${t("fields.visible")} — ${localized(service.name, locale)}`}
                onCheckedChange={(value) => {
                  setList(list.map((s) => (s.id === service.id ? { ...s, isVisible: value } : s)));
                  void run(() => toggleService(service.id, value), { success: "updated" });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("actions.edit")}
                onClick={() => setEditing(service)}
              >
                <Pencil {...uiIcon} size={14} />
              </Button>
              {permissions.delete ? (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={t("actions.delete")}>
                      <Trash2 {...uiIcon} size={14} />
                    </Button>
                  }
                  description={t("confirm.deleteBody", { name: localized(service.name, locale) })}
                  onConfirm={() => run(() => deleteService(service.id), { success: "deleted" })}
                />
              ) : null}
            </div>
          )}
        />
      ) : (
        <p className="text-muted text-sm">{t("categories.noServices")}</p>
      )}

      {editing ? (
        <ServiceDialog
          key={editing === "new" ? "new" : editing.id}
          service={editing === "new" ? null : editing}
          canToggle={permissions.toggle}
          onClose={() => setEditing(null)}
          onSave={(values) =>
            editing === "new"
              ? run(() => createService(categoryId, values), { success: "created", onSuccess: () => setEditing(null) })
              : run(() => updateService(editing.id, values), { onSuccess: () => setEditing(null) })
          }
        />
      ) : null}
    </section>
  );
}

type ServiceValues = { name: Localized; description: Localized; isVisible: boolean; arReviewed: boolean };

function ServiceDialog({
  service,
  canToggle,
  onClose,
  onSave,
}: {
  service: Service | null;
  canToggle: boolean;
  onClose: () => void;
  onSave: (values: ServiceValues) => void;
}) {
  const t = useTranslations("admin");
  const [values, setValues] = useState<ServiceValues>({
    name: service?.name ?? { en: "", ar: "" },
    description: service?.description ?? { en: "", ar: "" },
    isVisible: service?.isVisible ?? true,
    arReviewed: service ? !service.arNeedsReview : true,
  });
  const missingEn = !values.name.en.trim();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!missingEn) onSave(values);
          }}
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>{service ? t("actions.edit") : t("categories.addService")}</DialogTitle>
          </DialogHeader>
          {(["en", "ar"] as const).map((locale) => (
            <fieldset key={locale} className="space-y-2" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
              <legend className="type-label text-label">{t(`locale.${locale}`)}</legend>
              <label className="block space-y-1 text-sm">
                <span className="text-foreground font-semibold">{t("categories.serviceName")}</span>
                <Input
                  value={values.name[locale]}
                  onChange={(e) => setValues({ ...values, name: { ...values.name, [locale]: e.target.value } })}
                  aria-invalid={locale === "en" && missingEn ? true : undefined}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-foreground font-semibold">{t("categories.serviceDescription")}</span>
                <Textarea
                  rows={2}
                  value={values.description[locale]}
                  onChange={(e) =>
                    setValues({ ...values, description: { ...values.description, [locale]: e.target.value } })
                  }
                />
              </label>
            </fieldset>
          ))}
          {missingEn ? <p className="text-danger text-sm font-semibold">{t("validation.requiredEn")}</p> : null}
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={values.isVisible}
              disabled={!canToggle}
              onCheckedChange={(v) => setValues({ ...values, isVisible: v })}
            />
            {t("fields.visible")}
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={values.arReviewed}
              onCheckedChange={(v) => setValues({ ...values, arReviewed: v === true })}
            />
            {t("locale.markReviewed")}
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={missingEn}>
              {t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
