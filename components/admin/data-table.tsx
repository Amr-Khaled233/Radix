"use client";

import {
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { uiIcon } from "./ui-icon";

/** TanStack Table v9 features used by dashboard tables: client-side sorting. */
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
});

export type AdminColumn<T extends RowData> = ColumnDef<typeof features, T, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

type DataTableProps<T extends RowData> = {
  data: T[];
  columns: AdminColumn<T>[];
  /** Text matched by the search box for each row. */
  searchText?: (row: T) => string;
  toolbar?: ReactNode;
  empty?: ReactNode;
};

/** Search (applied before the table), sortable headers and brand styling. */
export function DataTable<T extends RowData>({ data, columns, searchText, toolbar, empty }: DataTableProps<T>) {
  const t = useTranslations("admin");
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const rowsData = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q && searchText ? data.filter((row) => searchText(row).toLowerCase().includes(q)) : data;
  }, [data, query, searchText]);

  const table = useTable({
    features,
    columns,
    data: rowsData,
    state: { sorting },
    onSortingChange: setSorting,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {searchText ? (
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
        ) : null}
        {toolbar}
        <span className="type-data text-muted sm:ms-auto">{t("table.rows", { count: rows.length })}</span>
      </div>

      <div className="bg-surface border-line overflow-x-auto border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const sort = header.column.getIsSorted();
                  const label = header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext());
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined}
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="type-label text-label hover:text-foreground inline-flex items-center gap-1"
                        >
                          {label}
                          {sort === "asc" ? (
                            <ArrowUp {...uiIcon} size={12} />
                          ) : sort === "desc" ? (
                            <ArrowDown {...uiIcon} size={12} />
                          ) : null}
                        </button>
                      ) : (
                        <span className="type-label text-label">{label}</span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted py-10 text-center">
                  {query ? t("empty.search") : (empty ?? t("empty.title"))}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
