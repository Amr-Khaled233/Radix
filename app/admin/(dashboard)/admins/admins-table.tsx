"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, MoreHorizontal, Plus, UserCheck, UserX, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type AdminColumn } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/empty-state";
import { TextInput } from "@/components/admin/fields";
import { uiIcon } from "@/components/admin/ui-icon";
import { useAction } from "@/components/admin/use-action";
import { useFieldError } from "@/components/admin/use-field-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteSchema } from "@/lib/auth/invite-schema";
import { ROLES, type Role } from "@/lib/db/schema/auth";
import {
  changeRoleAction,
  deactivateAction,
  deleteAdminAction,
  inviteAdminAction,
  reactivateAction,
  sendResetLinkAction,
} from "./actions";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  banned: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export function AdminsTable({ admins, currentUserId }: { admins: AdminRow[]; currentUserId: string }) {
  const t = useTranslations("admin");
  const format = useFormatter();
  const { run } = useAction();
  const [confirm, setConfirm] = useState<{ kind: "deactivate" | "delete"; admin: AdminRow } | null>(null);

  const columns: AdminColumn<AdminRow>[] = [
    {
      id: "admin",
      header: t("admins.columns.admin"),
      accessorFn: (a) => a.name,
      cell: ({ row: { original: a } }) => (
        <div>
          <p className="text-foreground font-semibold">
            {a.name}
            {a.id === currentUserId ? <span className="type-label text-label ms-2">{t("admins.you")}</span> : null}
          </p>
          <p className="text-muted text-xs" dir="ltr">
            {a.email}
          </p>
        </div>
      ),
    },
    {
      id: "role",
      header: t("admins.columns.role"),
      accessorFn: (a) => a.role,
      cell: ({ row: { original: a } }) =>
        a.id === currentUserId ? (
          <span>{t(`roles.${a.role}`)}</span>
        ) : (
          <Select
            value={a.role}
            onValueChange={(role) => run(() => changeRoleAction(a.id, role as Role), { success: "updated" })}
          >
            <SelectTrigger className="w-40" aria-label={`${t("admins.changeRole")} — ${a.name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {t(`roles.${role}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
    },
    {
      id: "status",
      header: t("admins.columns.status"),
      accessorFn: (a) => (a.banned ? 2 : a.lastLoginAt ? 0 : 1),
      cell: ({ row: { original: a } }) =>
        a.banned ? (
          <StatusBadge tone="danger">{t("admins.deactivated")}</StatusBadge>
        ) : a.lastLoginAt ? (
          <StatusBadge tone="success">{t("admins.active")}</StatusBadge>
        ) : (
          <StatusBadge tone="warning">{t("admins.pending")}</StatusBadge>
        ),
    },
    {
      id: "lastLogin",
      header: t("admins.columns.lastLogin"),
      accessorFn: (a) => a.lastLoginAt ?? "",
      cell: ({ row: { original: a } }) => (
        <span className="type-data text-muted text-xs">
          {a.lastLoginAt ? format.relativeTime(new Date(a.lastLoginAt)) : t("admins.never")}
        </span>
      ),
    },
    {
      id: "actions",
      header: t("table.actions"),
      enableSorting: false,
      cell: ({ row: { original: a } }) =>
        a.id === currentUserId ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`${t("actions.more")} — ${a.name}`}>
                <MoreHorizontal {...uiIcon} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() =>
                  run(() => sendResetLinkAction(a.id), {
                    success: false,
                    onSuccess: () => toast.success(t("admins.resetSent")),
                  })
                }
              >
                <KeyRound {...uiIcon} size={14} />
                {t("admins.sendReset")}
              </DropdownMenuItem>
              {a.banned ? (
                <DropdownMenuItem onSelect={() => run(() => reactivateAction(a.id), { success: "updated" })}>
                  <UserCheck {...uiIcon} size={14} />
                  {t("admins.reactivate")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setConfirm({ kind: "deactivate", admin: a })}>
                  <UserX {...uiIcon} size={14} />
                  {t("admins.deactivate")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-danger" onSelect={() => setConfirm({ kind: "delete", admin: a })}>
                <Trash2 {...uiIcon} size={14} />
                {t("actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    },
  ];

  return (
    <>
      <DataTable data={admins} columns={columns} searchText={(a) => `${a.name} ${a.email}`} />
      {confirm ? (
        <ConfirmDialog
          key={`${confirm.kind}-${confirm.admin.id}`}
          description={t(confirm.kind === "delete" ? "admins.deleteBody" : "admins.deactivateBody", {
            name: confirm.admin.name,
          })}
          confirmLabel={confirm.kind === "delete" ? t("actions.delete") : t("admins.deactivate")}
          onConfirm={() =>
            run(
              () =>
                confirm.kind === "delete" ? deleteAdminAction(confirm.admin.id) : deactivateAction(confirm.admin.id),
              {
                success: confirm.kind === "delete" ? "deleted" : "updated",
                onSuccess: () => setConfirm(null),
              },
            )
          }
          open
          onOpenChange={(open) => !open && setConfirm(null)}
        />
      ) : null}
    </>
  );
}

export function InviteAdminButton() {
  const t = useTranslations("admin");
  const fieldError = useFieldError();
  const { run, pending } = useAction();
  const [open, setOpen] = useState(false);
  const form = useForm<z.input<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: "", email: "", role: "editor", locale: "en" },
  });

  const submit = form.handleSubmit((values) =>
    run(() => inviteAdminAction(values), {
      success: false,
      onSuccess: () => {
        toast.success(t("admins.invited"));
        form.reset();
        setOpen(false);
      },
      onError: (result) => {
        if (result.error === "EMAIL_TAKEN") form.setError("email", { message: t("errors.EMAIL_TAKEN") });
      },
    }),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus {...uiIcon} size={16} />
          {t("admins.invite")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <DialogHeader>
            <DialogTitle>{t("admins.inviteTitle")}</DialogTitle>
            <DialogDescription>{t("admins.inviteBody")}</DialogDescription>
          </DialogHeader>
          <TextInput
            label={t("admins.name")}
            error={fieldError(form.formState.errors.name)}
            {...form.register("name")}
          />
          <TextInput
            label={t("admins.email")}
            type="email"
            dir="ltr"
            error={
              form.formState.errors.email?.message &&
              (fieldError(form.formState.errors.email) ?? form.formState.errors.email.message)
            }
            {...form.register("email")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <p className="text-foreground text-sm font-semibold">{t("admins.role")}</p>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label={t("admins.role")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(`roles.${role}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="locale"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <p className="text-foreground text-sm font-semibold">{t("admins.emailLanguage")}</p>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label={t("admins.emailLanguage")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("locale.en")}</SelectItem>
                      <SelectItem value="ar">{t("locale.ar")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("actions.saving") : t("admins.send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
