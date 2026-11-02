import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { asLocale, sendResetPasswordEmail, siteUrl } from "@/lib/email/send";
import { ac, authRoles } from "./access";
import { checkAdminChange, type AdminChange } from "./permissions";
import { countActiveSuperAdmins } from "./queries";
import { PASSWORD_MAX, PASSWORD_MIN } from "./schemas";

/** Admin-plugin endpoints that must pass the account safeguards. */
const GUARDED_ADMIN_PATHS: Record<string, (body: Record<string, unknown>) => AdminChange> = {
  "/admin/set-role": (body) => ({ type: "setRole", role: body.role as schema.Role }),
  "/admin/ban-user": () => ({ type: "deactivate" }),
  "/admin/remove-user": () => ({ type: "delete" }),
};

/** Nobody can see or directly set another admin's password, and impersonation is not offered. */
const BLOCKED_PATHS = new Set(["/admin/set-user-password", "/admin/impersonate-user", "/admin/stop-impersonating"]);

export const auth = betterAuth({
  appName: "RADIX",
  baseURL: process.env.BETTER_AUTH_URL ?? siteUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [siteUrl()],
  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: PASSWORD_MAX,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }) => {
      const locale = asLocale((user as { preferredLocale?: string }).preferredLocale);
      await sendResetPasswordEmail({ to: user.email, locale, token });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  user: {
    additionalFields: {
      preferredLocale: { type: "string", required: false, defaultValue: "en", input: false },
      preferredTheme: { type: "string", required: false, defaultValue: "system", input: false },
      lastLoginAt: { type: "date", required: false, input: false },
    },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
      "/reset-password": { window: 300, max: 10 },
      "/change-password": { window: 300, max: 5 },
    },
  },

  advanced: {
    cookiePrefix: "radix",
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
  },

  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await db.update(schema.user).set({ lastLoginAt: new Date() }).where(eq(schema.user.id, session.userId));
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (BLOCKED_PATHS.has(ctx.path)) {
        throw new APIError("FORBIDDEN", { message: "This action is not available." });
      }
      const toChange = GUARDED_ADMIN_PATHS[ctx.path];
      if (!toChange) return;

      // The session isn't on ctx.context yet in before-hooks, so resolve it here.
      const actorId = (await getSessionFromCtx(ctx))?.user.id;
      const body = (ctx.body ?? {}) as Record<string, unknown>;
      const targetId = typeof body.userId === "string" ? body.userId : undefined;
      if (!actorId || !targetId) return; // the plugin itself rejects unauthenticated/invalid calls

      const target = await db.query.user.findFirst({ where: eq(schema.user.id, targetId) });
      if (!target) return;
      const result = checkAdminChange({
        actorId,
        target,
        change: toChange(body),
        activeSuperAdminCount: await countActiveSuperAdmins(),
      });
      if (!result.ok) {
        throw new APIError("FORBIDDEN", {
          message:
            result.reason === "self"
              ? "You can’t change your own account here."
              : "The last super admin can’t be changed.",
          code: result.reason === "self" ? "SELF_CHANGE" : "LAST_SUPER_ADMIN",
        });
      }
    }),
  },

  plugins: [
    admin({
      ac,
      roles: authRoles,
      defaultRole: "editor",
      adminRoles: ["super_admin"],
    }),
    nextCookies(), // must stay last
  ],
});

export type Session = typeof auth.$Infer.Session;
