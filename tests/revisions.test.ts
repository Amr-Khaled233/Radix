import { describe, expect, it } from "vitest";
import { seedCategories } from "@/lib/content/brand";
import { REMOVED_SERVICES, reviseText, SERVICE_MOVES, TEXT_REVISIONS } from "@/scripts/db/revisions";

describe("content revisions", () => {
  it("replaces only strings that still match the old seed exactly", () => {
    const stored = {
      text: { en: "Rooted in Strategy. Built for Growth.", ar: "جذورنا استراتيجية، وبناؤنا للنمو." },
      edited: { en: "Our own words", ar: "جذورنا استراتيجية، وبناؤنا للنمو!" },
      list: [{ title: { en: "Technology & intelligent systems", ar: "التقنية والأنظمة الذكية" } }],
    };
    const revised = reviseText(stored);
    expect(revised.text).toEqual({
      en: "Rooted in Strategy. Built for Growth.",
      ar: "متجذّرون في الاستراتيجية، نبني من أجل النمو.",
    });
    expect(revised.edited).toBe(stored.edited);
    expect(revised.list[0].title).toEqual({ en: "Websites & digital systems", ar: "المواقع والأنظمة الرقمية" });
  });

  it("returns the same reference when nothing changes", () => {
    const value = { a: { en: "Custom", ar: "مخصص" }, n: 3 };
    expect(reviseText(value)).toBe(value);
  });

  it("revised text matches the current seed (no stale targets)", () => {
    const current = new Set(seedCategories.flatMap((c) => [c.name.ar, c.tagline.ar, ...c.services.map((s) => s.ar)]));
    const oldSeedNames = new Set(TEXT_REVISIONS.ar.map(([old]) => old));
    for (const category of seedCategories) {
      for (const service of category.services) expect(oldSeedNames.has(service.ar)).toBe(false);
    }
    expect(current.has("التجارب الرقمية")).toBe(true);
  });

  it("moves land in pillars that list those services, and removed services are gone", () => {
    for (const move of SERVICE_MOVES) {
      const target = seedCategories.find((c) => c.slug === move.to);
      expect(target?.services.some((s) => s.en === move.en)).toBe(true);
    }
    const all = seedCategories.flatMap((c) => c.services.map((s) => s.en));
    for (const removed of REMOVED_SERVICES) expect(all).not.toContain(removed.en);
  });
});
