/**
 * End-to-end auth flows against a real Postgres (PGlite over the wire
 * protocol), using the app's Better Auth instance and admin service.
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PORT = 54329;
process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres?sslmode=disable`;
process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
delete process.env.RESEND_API_KEY;

let server: PGLiteSocketServer;
let pg: PGlite;

// Loaded after the database is up (modules read DATABASE_URL on import).
let auth: typeof import("@/lib/auth/auth").auth;
let admins: typeof import("@/lib/auth/admins");
let db: typeof import("@/lib/db/client").db;
let schema: typeof import("@/lib/db/schema");
let sentEmails: typeof import("@/lib/email/send").sentEmails;
let orm: typeof import("drizzle-orm");

const OWNER = { email: "owner@example.com", name: "Owner", password: "owner-password-1" };

async function signIn(email: string, password: string) {
  const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  const cookie = response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return { ok: response.ok, status: response.status, headers: new Headers({ cookie }) };
}

function lastEmailTo(to: string) {
  const email = [...sentEmails].reverse().find((e) => e.to === to);
  if (!email?.url) throw new Error(`No email sent to ${to}`);
  return { ...email, token: new URL(email.url).searchParams.get("token")! };
}

async function userByEmail(email: string) {
  return (await db.query.user.findFirst({ where: orm.eq(schema.user.email, email) }))!;
}

async function actorFor(email: string) {
  const u = await userByEmail(email);
  return { id: u.id, role: u.role, banned: u.banned, name: u.name };
}

beforeAll(async () => {
  pg = new PGlite();
  server = new PGLiteSocketServer({ db: pg, port: PORT, host: "127.0.0.1", maxConnections: 10 });
  await server.start();

  ({ auth } = await import("@/lib/auth/auth"));
  admins = await import("@/lib/auth/admins");
  ({ db } = await import("@/lib/db/client"));
  schema = await import("@/lib/db/schema");
  ({ sentEmails } = await import("@/lib/email/send"));
  orm = await import("drizzle-orm");

  await migrate(db, { migrationsFolder: "./drizzle" });

  // First super admin, created the same way as `pnpm db:seed:admin`.
  const ctx = await auth.$context;
  const owner = await ctx.internalAdapter.createUser(
    { name: OWNER.name, email: OWNER.email, emailVerified: true, role: "super_admin" },
    { method: "admin" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: owner.id,
    providerId: "credential",
    accountId: owner.id,
    password: await ctx.password.hash(OWNER.password),
  });
});

afterAll(async () => {
  await (db as unknown as { $client?: { end(): Promise<void> } } | undefined)?.$client?.end();
  await server?.stop();
  await pg?.close();
});

describe("sign-in", () => {
  it("signs in with the right password and rejects a wrong one", async () => {
    expect((await signIn(OWNER.email, OWNER.password)).ok).toBe(true);
    expect((await signIn(OWNER.email, "wrong-password-1")).ok).toBe(false);
  });

  it("records the last login time", async () => {
    expect((await userByEmail(OWNER.email)).lastLoginAt).toBeInstanceOf(Date);
  });

  it("public sign-up is disabled", async () => {
    await expect(
      auth.api.signUpEmail({ body: { email: "stranger@example.com", password: "stranger-pass-1", name: "Stranger" } }),
    ).rejects.toThrow();
    expect(await db.query.user.findFirst({ where: orm.eq(schema.user.email, "stranger@example.com") })).toBeUndefined();
  });
});

describe("forgot / reset password", () => {
  it("gives the same answer for unknown emails and sends nothing", async () => {
    const before = sentEmails.length;
    const result = await auth.api.requestPasswordReset({ body: { email: "nobody@example.com" } });
    expect(result.status).toBe(true);
    expect(sentEmails.length).toBe(before);
  });

  it("emails a single-use link that resets the password and revokes sessions", async () => {
    const session = await signIn(OWNER.email, OWNER.password);
    expect(await auth.api.getSession({ headers: session.headers })).not.toBeNull();

    await auth.api.requestPasswordReset({ body: { email: OWNER.email } });
    const email = lastEmailTo(OWNER.email);
    expect(email.url).toContain("/admin/reset-password?token=");
    expect(email.subject).toMatch(/reset/i);

    await auth.api.resetPassword({ body: { token: email.token, newPassword: "owner-password-2" } });
    OWNER.password = "owner-password-2";

    expect(await auth.api.getSession({ headers: session.headers })).toBeNull();
    expect((await signIn(OWNER.email, "owner-password-1")).ok).toBe(false);
    expect((await signIn(OWNER.email, OWNER.password)).ok).toBe(true);

    await expect(
      auth.api.resetPassword({ body: { token: email.token, newPassword: "owner-password-3" } }),
    ).rejects.toThrow();
  });

  it("rejects passwords shorter than 10 characters", async () => {
    await auth.api.requestPasswordReset({ body: { email: OWNER.email } });
    const { token } = lastEmailTo(OWNER.email);
    await expect(auth.api.resetPassword({ body: { token, newPassword: "short-1" } })).rejects.toThrow();
  });
});

describe("invitations", () => {
  it("invites an admin who sets a password through the emailed link", async () => {
    const owner = await actorFor(OWNER.email);
    await admins.inviteAdmin(owner, { name: "Ada Editor", email: "ada@example.com", role: "editor", locale: "ar" });

    const invited = await userByEmail("ada@example.com");
    expect(invited.role).toBe("editor");
    expect(invited.preferredLocale).toBe("ar");

    const email = lastEmailTo("ada@example.com");
    expect(email.url).toContain("invite=1");
    expect(email.html).toContain('dir="rtl"');
    expect(email.text.length).toBeGreaterThan(20);

    // Unknown random password until the invite is accepted.
    expect((await signIn("ada@example.com", "anything-goes-1")).ok).toBe(false);

    await auth.api.resetPassword({ body: { token: email.token, newPassword: "ada-password-1" } });
    expect((await signIn("ada@example.com", "ada-password-1")).ok).toBe(true);
  });

  it("invite links expire after 48 hours", async () => {
    const owner = await actorFor(OWNER.email);
    await admins.inviteAdmin(owner, { name: "Late Larry", email: "larry@example.com", role: "admin" });
    const { token } = lastEmailTo("larry@example.com");

    const row = await db.query.verification.findFirst({
      where: orm.eq(schema.verification.identifier, `reset-password:${token}`),
    });
    const hours = (row!.expiresAt.getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(47.9);
    expect(hours).toBeLessThanOrEqual(48);

    await db
      .update(schema.verification)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(orm.eq(schema.verification.id, row!.id));
    await expect(auth.api.resetPassword({ body: { token, newPassword: "larry-password-1" } })).rejects.toThrow();
  });

  it("rejects duplicate emails and non-super-admin inviters", async () => {
    const owner = await actorFor(OWNER.email);
    await expect(admins.inviteAdmin(owner, { name: "Dup", email: "ada@example.com", role: "editor" })).rejects.toThrow(
      "EMAIL_TAKEN",
    );
    const ada = await actorFor("ada@example.com");
    await expect(admins.inviteAdmin(ada, { name: "X", email: "x@example.com", role: "admin" })).rejects.toThrow(
      /Forbidden/,
    );
  });

  it("a super admin can send a reset link to another admin", async () => {
    const owner = await actorFor(OWNER.email);
    const ada = await userByEmail("ada@example.com");
    await admins.sendAdminResetLink(owner, ada.id);
    const email = lastEmailTo("ada@example.com");
    expect(email.url).not.toContain("invite=1");
    const ttl = await db.query.verification.findFirst({
      where: orm.eq(schema.verification.identifier, `reset-password:${email.token}`),
    });
    expect((ttl!.expiresAt.getTime() - Date.now()) / 60_000).toBeLessThanOrEqual(60);
  });

  it("writes every admin mutation to the audit log", async () => {
    const rows = await db.select().from(schema.auditLog);
    expect(rows.map((r) => r.action)).toEqual(expect.arrayContaining(["admin.invite", "admin.sendResetLink"]));
  });
});

describe("roles and safeguards", () => {
  it("the only super admin can't demote, deactivate or delete themselves", async () => {
    const owner = await actorFor(OWNER.email);
    await expect(admins.changeAdminRole(owner, owner.id, "admin")).rejects.toThrow("SELF_CHANGE");
    await expect(admins.deactivateAdmin(owner, owner.id)).rejects.toThrow("SELF_CHANGE");
    await expect(admins.deleteAdmin(owner, owner.id)).rejects.toThrow("SELF_CHANGE");
  });

  it("the plugin endpoints enforce the same safeguards", async () => {
    const session = await signIn(OWNER.email, OWNER.password);
    const owner = await userByEmail(OWNER.email);
    await expect(
      auth.api.setRole({ body: { userId: owner.id, role: "admin" }, headers: session.headers }),
    ).rejects.toThrow();
    await expect(
      auth.api.setUserPassword({ body: { userId: owner.id, newPassword: "hijack-pass-1" }, headers: session.headers }),
    ).rejects.toThrow();
    expect((await userByEmail(OWNER.email)).role).toBe("super_admin");
  });

  it("non-super-admins can't use the admin plugin endpoints", async () => {
    const session = await signIn("ada@example.com", "ada-password-1");
    const owner = await userByEmail(OWNER.email);
    await expect(auth.api.banUser({ body: { userId: owner.id }, headers: session.headers })).rejects.toThrow();
    await expect(auth.api.listUsers({ query: {}, headers: session.headers })).rejects.toThrow();
  });

  it("the last super admin is protected even from another super admin's demotion attempts once alone", async () => {
    const owner = await actorFor(OWNER.email);
    const larry = await userByEmail("larry@example.com");
    await admins.changeAdminRole(owner, larry.id, "super_admin");
    const larryActor = await actorFor("larry@example.com");

    // Two super admins: Larry may demote the owner…
    await admins.changeAdminRole(larryActor, owner.id, "admin");
    // …but now Larry is the last one and can't be demoted by anyone.
    const demotedOwner = await actorFor(OWNER.email);
    await expect(admins.changeAdminRole(demotedOwner, larry.id, "editor")).rejects.toThrow(/Forbidden/);

    // Restore: Larry promotes the owner back.
    await admins.changeAdminRole(larryActor, owner.id, "super_admin");
    expect((await userByEmail(OWNER.email)).role).toBe("super_admin");
  });

  it("deactivating an admin ends their sessions and blocks sign-in; reactivating restores access", async () => {
    const owner = await actorFor(OWNER.email);
    const ada = await userByEmail("ada@example.com");
    const session = await signIn("ada@example.com", "ada-password-1");

    await admins.deactivateAdmin(owner, ada.id);
    expect(await auth.api.getSession({ headers: session.headers })).toBeNull();
    expect((await signIn("ada@example.com", "ada-password-1")).ok).toBe(false);

    await admins.reactivateAdmin(owner, ada.id);
    expect((await signIn("ada@example.com", "ada-password-1")).ok).toBe(true);
  });

  it("deleting an admin removes their account", async () => {
    const owner = await actorFor(OWNER.email);
    const ada = await userByEmail("ada@example.com");
    await admins.deleteAdmin(owner, ada.id);
    expect(await db.query.user.findFirst({ where: orm.eq(schema.user.id, ada.id) })).toBeUndefined();
  });
});
