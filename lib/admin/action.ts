import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { ForbiddenError } from "@/lib/auth/permissions";
import { requireAdmin, UnauthorizedError, type AdminUser } from "@/lib/auth/session";
import { AdminActionError } from "@/lib/auth/admins";

/**
 * Uniform Server Action result. Actions never throw to the client; the UI
 * shows a toast or field errors from `error`.
 */
export type ActionError =
  "unauthorized" | "forbidden" | "validation" | "notFound" | "conflict" | "inUse" | "server" | AdminActionError["code"];

export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: ActionError; fieldErrors?: Record<string, string[]> };

/** Thrown inside actions for expected business errors. */
export class ActionFailure extends Error {
  constructor(readonly code: ActionError) {
    super(code);
    this.name = "ActionFailure";
  }
}

/**
 * Wraps every dashboard Server Action: resolves the signed-in admin (or fails),
 * runs the body and maps errors. Authorization (`assertCan`) happens inside
 * `fn`, next to the data it protects.
 */
export async function adminAction<T>(fn: (actor: AdminUser) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const actor = await requireAdmin();
    return { ok: true, data: await fn(actor) };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: "unauthorized" };
    if (error instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    if (error instanceof ActionFailure) return { ok: false, error: error.code };
    if (error instanceof AdminActionError) return { ok: false, error: error.code };
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: "validation",
        fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
      };
    }
    if (isUniqueViolation(error)) return { ok: false, error: "conflict" };
    console.error("[admin action]", error);
    return { ok: false, error: "server" };
  }
}

function isUniqueViolation(error: unknown) {
  const code =
    (error as { code?: string; cause?: { code?: string } })?.code ??
    (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

/** Expires public cache tags so changes appear on the live site immediately (both locales). */
export function refreshTags(...tags: string[]) {
  for (const tag of new Set(tags)) updateTag(tag);
}
