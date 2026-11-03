import { describe, expect, it } from "vitest";
import { inScope, messageScopeFor, notificationRecipients } from "@/lib/messages/scope";

const SITES = "11111111-1111-4111-8111-111111111111";
const BRAND = "22222222-2222-4222-8222-222222222222";

describe("message scope", () => {
  it("super admin sees every message", () => {
    const scope = messageScopeFor({ role: "super_admin" }, []);
    expect(inScope(scope, [])).toBe(true);
    expect(inScope(scope, [BRAND])).toBe(true);
  });

  it("other accounts see only their pillars", () => {
    const scope = messageScopeFor({ role: "admin" }, [SITES]);
    expect(inScope(scope, [SITES])).toBe(true);
    expect(inScope(scope, [BRAND, SITES])).toBe(true);
    expect(inScope(scope, [BRAND])).toBe(false);
    expect(inScope(scope, [])).toBe(false);
  });

  it("no pillar, or deactivated, means no inbox", () => {
    expect(messageScopeFor({ role: "admin" }, [])).toBeNull();
    expect(messageScopeFor({ role: "editor", banned: true }, [SITES])).toBeNull();
    expect(messageScopeFor({ role: "super_admin", banned: true }, [])).toBeNull();
  });
});

describe("notification recipients", () => {
  const accounts = [
    { email: "owner@example.com", role: "super_admin" as const, categoryIds: [] },
    { email: "sites@example.com", role: "admin" as const, categoryIds: [SITES] },
    { email: "gone@example.com", role: "editor" as const, banned: true, categoryIds: [SITES] },
  ];

  it("only the active accounts responsible for the pillar", () => {
    expect(notificationRecipients([SITES], accounts, ["team@example.com"])).toEqual(["sites@example.com"]);
  });

  it("unassigned pillar → Settings addresses, else the super admin", () => {
    expect(notificationRecipients([BRAND], accounts, ["team@example.com"])).toEqual(["team@example.com"]);
    expect(notificationRecipients([], accounts, [])).toEqual(["owner@example.com"]);
  });
});
