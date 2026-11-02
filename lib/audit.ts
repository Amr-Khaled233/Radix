import "server-only";
import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";

export async function logAudit(entry: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: Record<string, unknown>;
}) {
  await db.insert(auditLog).values({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    summary: entry.summary ?? {},
  });
}
