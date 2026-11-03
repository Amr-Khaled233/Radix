"use server";

import { and, inArray } from "drizzle-orm";
import { z } from "@/lib/zod";
import { logAudit } from "@/lib/audit";
import { ActionFailure, adminAction } from "@/lib/admin/action";
import { db } from "@/lib/db/client";
import { contactSubmissions } from "@/lib/db/schema";
import { getMessageScope, scopeWhere } from "@/lib/messages/access";

const statusSchema = z.enum(["new", "read", "archived"]);

export async function setMessageStatus(ids: string[], status: z.infer<typeof statusSchema>) {
  return adminAction(async (actor) => {
    const scope = await getMessageScope(actor);
    if (!scope) throw new ActionFailure("forbidden");
    const parsed = z.array(z.uuid()).min(1).parse(ids);
    const next = statusSchema.parse(status);
    // Only messages inside the account's scope are changed.
    await db
      .update(contactSubmissions)
      .set({ status: next })
      .where(and(inArray(contactSubmissions.id, parsed), scopeWhere(scope)));
    if (next === "archived") {
      await logAudit({
        actorId: actor.id,
        action: "message.archive",
        entityType: "message",
        summary: { count: parsed.length },
      });
    }
  });
}
