import { desc } from "drizzle-orm";
import { getAdminUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { categories, contactSubmissions } from "@/lib/db/schema";
import { getMessageScope, scopeWhere } from "@/lib/messages/access";

/** Neutralises spreadsheet formula injection and quotes CSV fields. */
function cell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** CSV export of the contact submissions this account may see. */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const scope = await getMessageScope(user);
  if (!scope) return new Response("Forbidden", { status: 403 });

  const [rows, cats] = await Promise.all([
    db.select().from(contactSubmissions).where(scopeWhere(scope)).orderBy(desc(contactSubmissions.createdAt)),
    db.select({ id: categories.id, name: categories.name }).from(categories),
  ]);
  const catName = new Map(cats.map((c) => [c.id, c.name.en]));
  const header = ["Received", "Status", "Name", "Email", "Company", "Phone", "Interested in", "Language", "Message"];
  const lines = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      r.status,
      r.name,
      r.email,
      r.company,
      r.phone,
      r.categoryIds
        .map((id) => catName.get(id) ?? "")
        .filter(Boolean)
        .join("; "),
      r.locale,
      r.message,
    ]
      .map(cell)
      .join(","),
  );
  // BOM so Excel opens UTF-8 (Arabic) correctly.
  const body = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="radix-messages-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
