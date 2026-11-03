import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { asLocale, sendResetPasswordEmail, siteUrl } from "@/lib/email/send";
import { ac, authRoles } from "./access";
import { PASSWORD_MAX, PASSWORD_MIN } from "./schemas";

/**
 * The admin plugin is used for roles and for blocking deactivated accounts only.
 * Its HTTP endpoints (/admin/*) are closed: account management goes through
 * lib/auth/admins.ts, which enforces permissions and the last-super-admin rules.
 */
const isAdminPluginEndpoint = (path: string) => path.startsWith("/admin/");

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
      preferredTheme: { type: "string", required: false, defaultValue: "dark", input: false },
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
      if (isAdminPluginEndpoint(ctx.path)) {
        throw new APIError("FORBIDDEN", { message: "This action is not available." });
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
