import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { requestLimits } from "@/lib/db/schema";

/** Salted hash so raw IP addresses are never stored. */
export function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${process.env.BETTER_AUTH_SECRET ?? "radix"}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Fixed-window counter in Postgres (works across serverless instances).
 * Returns true when the request is allowed.
 */
export async function allowRequest(bucket: string, key: string, limit: number, windowSeconds: number) {
  const id = `${bucket}:${key}`;
  const windowStart = new Date(Date.now() - windowSeconds * 1000);
  const [row] = await db
    .insert(requestLimits)
    .values({ key: id, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: requestLimits.key,
      set: {
        count: sql`case when ${requestLimits.windowStart} < ${windowStart} then 1 else ${requestLimits.count} + 1 end`,
        windowStart: sql`case when ${requestLimits.windowStart} < ${windowStart} then now() else ${requestLimits.windowStart} end`,
      },
    })
    .returning({ count: requestLimits.count });
  return (row?.count ?? 1) <= limit;
}
