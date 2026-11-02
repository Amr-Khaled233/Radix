"use client";

import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type AdminColumn } from "@/components/admin/data-table";

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: Record<string, unknown>;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
};

function describe(summary: Record<string, unknown>) {
  return Object.entries(summary)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
}

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  const t = useTranslations("admin.audit");
  const format = useFormatter();

  const columns: AdminColumn<AuditRow>[] = [
    {
      id: "when",
      header: t("columns.when"),
      accessorFn: (r) => r.createdAt,
      cell: ({ row: { original: r } }) => (
        <span className="type-data text-muted text-xs whitespace-nowrap">
          {format.dateTime(new Date(r.createdAt), { dateStyle: "medium", timeStyle: "short" })}
        </span>
      ),
    },
    {
      id: "who",
      header: t("columns.who"),
      accessorFn: (r) => r.actorName ?? "",
      cell: ({ row: { original: r } }) => <span className="text-foreground">{r.actorName ?? t("system")}</span>,
    },
    {
      id: "action",
      header: t("columns.action"),
      accessorFn: (r) => r.action,
      cell: ({ row: { original: r } }) => (
        <span className="type-data text-foreground" dir="ltr">
          {r.action}
        </span>
      ),
    },
    {
      id: "item",
      header: t("columns.item"),
      enableSorting: false,
      cell: ({ row: { original: r } }) => (
        <span className="text-muted text-xs" dir="ltr">
          {[r.entityType, describe(r.summary)].filter(Boolean).join(" — ")}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      searchText={(r) =>
        `${r.action} ${r.entityType} ${r.actorName ?? ""} ${r.actorEmail ?? ""} ${describe(r.summary)}`
      }
      empty={t("empty")}
    />
  );
}
