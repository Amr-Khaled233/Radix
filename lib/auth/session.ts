import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/db/schema/auth";
import { auth } from "./auth";
import type { Actor } from "./permissions";

export type AdminUser = Actor & {
  name: string;
  email: string;
  image: string | null;
  preferredLocale: string;
  preferredTheme: string;
};

/** Current signed-in admin, or null. Banned (deactivated) users never have a session. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user as typeof session.user & {
    role: Role;
    banned?: boolean | null;
    preferredLocale?: string;
    preferredTheme?: string;
  };
  if (u.banned) return null;
  return {
    id: u.id,
    role: u.role,
    banned: u.banned,
    name: u.name,
    email: u.email,
    image: u.image ?? null,
    preferredLocale: u.preferredLocale ?? "en",
    preferredTheme: u.preferredTheme ?? "system",
  };
}

/** For dashboard pages: redirects to the login page when signed out. */
export async function requireAdminPage(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** For Server Actions and route handlers: throws when signed out. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
