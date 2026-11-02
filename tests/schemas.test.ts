import { describe, expect, it } from "vitest";
import { completeness, t, tRich } from "@/lib/db/localized";
import { loginSchema, passwordStrength, resetSchema } from "@/lib/auth/schemas";
import { heroConfigSchema, SETTINGS_SCHEMAS } from "@/lib/settings/schemas";

describe("auth schemas", () => {
  it("requires 10+ character passwords that match", () => {
    expect(resetSchema.safeParse({ password: "short", confirm: "short" }).success).toBe(false);
    const mismatch = resetSchema.safeParse({ password: "long-enough-1", confirm: "long-enough-2" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0]?.message).toBe("passwordMatch");
    expect(resetSchema.safeParse({ password: "long-enough-1", confirm: "long-enough-1" }).success).toBe(true);
  });

  it("normalizes login email and returns translation keys as messages", () => {
    const parsed = loginSchema.safeParse({ email: "  Owner@Example.COM ", password: "x" });
    expect(parsed.success && parsed.data.email).toBe("owner@example.com");
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).error?.issues[0]?.message).toBe("email");
  });

  it("scores password strength 0–4", () => {
    expect(passwordStrength("")).toBe(0);
    expect(passwordStrength("abc")).toBeLessThanOrEqual(1);
    expect(passwordStrength("abcdefghijkl")).toBe(1);
    expect(passwordStrength("Correct-Horse-Battery-9")).toBe(4);
  });
});

describe("localized helpers", () => {
  it("falls back to the other language when empty", () => {
    expect(t({ en: "Brand", ar: "" }, "ar")).toBe("Brand");
    expect(t({ en: "Brand", ar: "الهوية" }, "ar")).toBe("الهوية");
    expect(t(null, "en")).toBe("");
  });

  it("falls back for rich text and reports completeness", () => {
    const doc = { type: "doc" as const, content: [{ type: "paragraph" }] };
    expect(tRich({ en: doc, ar: null }, "ar")).toEqual(doc);
    expect(
      completeness([
        { en: "A", ar: "" },
        { en: doc, ar: null },
      ]),
    ).toEqual({ en: true, ar: false });
  });
});

describe("settings schemas", () => {
  it("every key parses its defaults (except about, which is seeded)", () => {
    for (const [key, schema] of Object.entries(SETTINGS_SCHEMAS)) {
      if (key === "about") continue;
      expect(() => schema.parse({}), key).not.toThrow();
    }
  });

  it("hero config enforces the dashboard ranges", () => {
    expect(heroConfigSchema.parse({}).mode).toBe("scrub");
    expect(heroConfigSchema.safeParse({ scrollLength: { desktop: 700, mobile: 200 } }).success).toBe(false);
    expect(heroConfigSchema.safeParse({ overlayOpacity: 90 }).success).toBe(false);
  });
});
