"use client";

import { Mail } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { DataTable, type AdminColumn } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/empty-state";
import { uiIcon } from "@/components/admin/ui-icon";
import { useAction } from "@/components/admin/use-action";
import { useSyncedState } from "@/components/admin/use-synced-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { contactSubmissions } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/routing";
import { t as localized, type Localized } from "@/lib/localized";
import { cn } from "@/lib/cn";
import { setMessageStatus } from "./actions";

type Message = Omit<typeof contactSubmissions.$inferSelect, "createdAt"> & { createdAt: string };
type Status = Message["status"];

const TONE = { new: "accent", read: "neutral", archived: "warning" } as const;

export function MessagesInbox({
  messages,
  categories,
}: {
  messages: Message[];
  categories: { id: string; name: Localized }[];
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const { run } = useAction();
  const [list, setList] = useSyncedState(messages);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [open, setOpen] = useState<Message | null>(null);
  const catName = new Map(categories.map((c) => [c.id, localized(c.name, locale)]));

  const update = (message: Message, status: Status, toast: boolean) => {
    setList(list.map((m) => (m.id === message.id ? { ...m, status } : m)));
    if (open?.id === message.id) setOpen({ ...message, status });
    void run(() => setMessageStatus([message.id], status), { success: toast ? "updated" : false });
  };

  const openMessage = (message: Message) => {
    setOpen(message);
    if (message.status === "new") update(message, "read", false);
  };

  const columns: AdminColumn<Message>[] = [
    {
      id: "from",
      header: t("messages.columns.from"),
      accessorFn: (m) => m.name,
      cell: ({ row: { original: m } }) => (
        <button type="button" onClick={() => openMessage(m)} className="text-start">
          <span className={cn("text-foreground block hover:underline", m.status === "new" && "font-bold")}>
            {m.name}
          </span>
          <span className="text-muted block text-xs" dir="ltr">
            {m.email}
          </span>
        </button>
      ),
    },
    {
      id: "company",
      header: t("messages.columns.company"),
      accessorFn: (m) => m.company ?? "",
      cell: ({ getValue }) => <span className="text-muted">{getValue() as string}</span>,
    },
    {
      id: "interests",
      header: t("messages.columns.interests"),
      enableSorting: false,
      cell: ({ row: { original: m } }) => (
        <span className="text-muted text-sm">
          {m.categoryIds
            .map((id) => catName.get(id))
            .filter(Boolean)
            .join(" · ")}
        </span>
      ),
    },
    {
      id: "received",
      header: t("messages.columns.received"),
      accessorFn: (m) => m.createdAt,
      cell: ({ row: { original: m } }) => (
        <span className="type-data text-muted text-xs">
          {format.dateTime(new Date(m.createdAt), { dateStyle: "medium", timeStyle: "short" })}
        </span>
      ),
    },
    {
      id: "status",
      header: t("messages.columns.status"),
      accessorFn: (m) => m.status,
      cell: ({ row: { original: m } }) => (
        <StatusBadge tone={TONE[m.status]}>{t(`messages.status.${m.status}`)}</StatusBadge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={list.filter((m) => (filter === "all" ? m.status !== "archived" : m.status === filter))}
        columns={columns}
        searchText={(m) => `${m.name} ${m.email} ${m.company ?? ""} ${m.message}`}
        empty={t("messages.empty")}
        toolbar={
          <div role="group" aria-label={t("actions.filter")} className="border-line flex border">
            {(["all", "new", "read", "archived"] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={cn(
                  "px-3 py-2 text-sm font-semibold",
                  filter === key ? "bg-inverse text-on-inverse" : "text-muted",
                )}
              >
                {key === "all" ? t("messages.all") : t(`messages.status.${key}`)}
              </button>
            ))}
          </div>
        }
      />

      <Dialog open={Boolean(open)} onOpenChange={(value) => !value && setOpen(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          {open ? (
            <>
              <DialogHeader>
                <DialogTitle>{open.name}</DialogTitle>
              </DialogHeader>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted">{t("admins.email")}</dt>
                <dd dir="ltr" className="text-start">
                  {open.email}
                </dd>
                {open.company ? (
                  <>
                    <dt className="text-muted">{t("messages.columns.company")}</dt>
                    <dd>{open.company}</dd>
                  </>
                ) : null}
                {open.phone ? (
                  <>
                    <dt className="text-muted">{t("messages.phone")}</dt>
                    <dd dir="ltr" className="text-start">
                      {open.phone}
                    </dd>
                  </>
                ) : null}
                {open.categoryIds.length ? (
                  <>
                    <dt className="text-muted">{t("messages.columns.interests")}</dt>
                    <dd>
                      {open.categoryIds
                        .map((id) => catName.get(id))
                        .filter(Boolean)
                        .join(" · ")}
                    </dd>
                  </>
                ) : null}
                <dt className="text-muted">{t("messages.language")}</dt>
                <dd>{t(`locale.${open.locale === "ar" ? "ar" : "en"}`)}</dd>
                <dt className="text-muted">{t("messages.columns.received")}</dt>
                <dd>{format.dateTime(new Date(open.createdAt), { dateStyle: "full", timeStyle: "short" })}</dd>
              </dl>
              <div className="bg-background border-line border p-4 text-sm whitespace-pre-wrap" dir="auto">
                {open.message}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={`mailto:${open.email}?subject=${encodeURIComponent("RADIX")}`}>
                    <Mail {...uiIcon} size={16} />
                    {t("messages.reply")}
                  </a>
                </Button>
                {open.status !== "new" ? (
                  <Button type="button" variant="outline" onClick={() => update(open, "new", true)}>
                    {t("messages.markNew")}
                  </Button>
                ) : null}
                {open.status !== "archived" ? (
                  <Button type="button" variant="outline" onClick={() => update(open, "archived", true)}>
                    {t("messages.archive")}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => update(open, "read", true)}>
                    {t("messages.unarchive")}
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
