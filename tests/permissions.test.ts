import { describe, expect, it } from "vitest";
import { assertCan, can, checkAdminChange, ForbiddenError, type Actor } from "@/lib/auth/permissions";

const superAdmin: Actor = { id: "s1", role: "super_admin" };
const admin: Actor = { id: "a1", role: "admin" };
const editor: Actor = { id: "e1", role: "editor" };

describe("permission map (spec §6)", () => {
  it("only super admins manage admins and see the audit log", () => {
    for (const action of ["view", "create", "edit", "delete"] as const) {
      expect(can(superAdmin, action, "admins")).toBe(true);
      expect(can(admin, action, "admins")).toBe(false);
      expect(can(editor, action, "admins")).toBe(false);
    }
    expect(can(superAdmin, "view", "auditLog")).toBe(true);
    expect(can(admin, "view", "auditLog")).toBe(false);
  });

  it("site settings: super admin and admin only", () => {
    expect(can(superAdmin, "edit", "settings")).toBe(true);
    expect(can(admin, "edit", "settings")).toBe(true);
    expect(can(editor, "edit", "settings")).toBe(false);
  });

  it("categories & services: editors can edit only", () => {
    expect(can(editor, "edit", "categories")).toBe(true);
    expect(can(editor, "edit", "services")).toBe(true);
    for (const action of ["create", "reorder", "toggleVisibility", "delete"] as const) {
      expect(can(editor, action, "categories")).toBe(false);
      expect(can(admin, action, "categories")).toBe(true);
    }
  });

  it("projects / team / pages: editors create and edit drafts but never publish or delete", () => {
    for (const resource of ["projects", "team"] as const) {
      expect(can(editor, "create", resource)).toBe(true);
      expect(can(editor, "edit", resource)).toBe(true);
      expect(can(editor, "publish", resource)).toBe(false);
      expect(can(editor, "delete", resource)).toBe(false);
      expect(can(admin, "publish", resource)).toBe(true);
      expect(can(admin, "delete", resource)).toBe(true);
    }
    expect(can(editor, "edit", "pages")).toBe(true);
    expect(can(editor, "publish", "pages")).toBe(false);
  });

  it("media: editors upload and edit alt text; deleting needs admin", () => {
    expect(can(editor, "create", "media")).toBe(true);
    expect(can(editor, "edit", "media")).toBe(true);
    expect(can(editor, "delete", "media")).toBe(false);
    expect(can(admin, "delete", "media")).toBe(true);
  });

  // Message access is per pillar (tests/message-scope.test.ts); only the super admin has it by role.
  it("messages inbox by role: super admin only", () => {
    expect(can(admin, "view", "messages")).toBe(false);
    expect(can(editor, "view", "messages")).toBe(false);
  });

  it("denies signed-out and deactivated users everything", () => {
    expect(can(null, "view", "projects")).toBe(false);
    expect(can({ ...superAdmin, banned: true }, "view", "projects")).toBe(false);
  });

  it("assertCan throws ForbiddenError", () => {
    expect(() => assertCan(editor, "delete", "projects")).toThrow(ForbiddenError);
    expect(() => assertCan(admin, "delete", "projects")).not.toThrow();
  });
});

describe("admin account safeguards", () => {
  const target = (role: Actor["role"], id = "t1", banned = false) => ({ id, role, banned });

  it("nobody can change their own role, status or account", () => {
    for (const change of [{ type: "setRole", role: "editor" }, { type: "deactivate" }, { type: "delete" }] as const) {
      expect(
        checkAdminChange({ actorId: "s1", target: target("super_admin", "s1"), change, activeSuperAdminCount: 3 }),
      ).toEqual({ ok: false, reason: "self" });
    }
  });

  it("the last active super admin can't be demoted, deactivated or deleted", () => {
    for (const change of [{ type: "setRole", role: "admin" }, { type: "deactivate" }, { type: "delete" }] as const) {
      expect(
        checkAdminChange({ actorId: "s2", target: target("super_admin"), change, activeSuperAdminCount: 1 }),
      ).toEqual({ ok: false, reason: "lastSuperAdmin" });
    }
  });

  it("allows changes when another super admin remains", () => {
    expect(
      checkAdminChange({
        actorId: "s2",
        target: target("super_admin"),
        change: { type: "setRole", role: "admin" },
        activeSuperAdminCount: 2,
      }),
    ).toEqual({ ok: true });
  });

  it("allows changes to non-super-admins and keeping the super_admin role", () => {
    expect(
      checkAdminChange({
        actorId: "s1",
        target: target("editor"),
        change: { type: "delete" },
        activeSuperAdminCount: 1,
      }),
    ).toEqual({ ok: true });
    expect(
      checkAdminChange({
        actorId: "s2",
        target: target("super_admin"),
        change: { type: "setRole", role: "super_admin" },
        activeSuperAdminCount: 1,
      }),
    ).toEqual({ ok: true });
  });
});
