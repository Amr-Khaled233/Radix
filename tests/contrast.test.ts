import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb, mixRgb, type Rgb } from "@/lib/contrast";

/**
 * Parses the token blocks in app/globals.css and checks every text/UI pair the
 * components use, in both themes. Fails when a token edit breaks WCAG AA.
 */
const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

function block(selectorStart: string) {
  const start = css.indexOf(selectorStart);
  if (start === -1) throw new Error(`Missing block ${selectorStart}`);
  const open = css.indexOf("{", start);
  return css.slice(open + 1, css.indexOf("}", open));
}

function declarations(body: string) {
  return Object.fromEntries(
    [...body.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  );
}

const palette = Object.fromEntries(
  Object.entries(declarations(block(":root {\n  --palette"))).map(([k, v]) => [k, hexToRgb(v)]),
) as Record<string, Rgb>;

function resolve(value: string): Rgb {
  const ref = value.match(/^var\(--palette-([a-z]+)\)$/);
  if (ref) return palette[`palette-${ref[1]}`];
  const mix = value.match(/^color-mix\(in srgb, var\(--palette-([a-z]+)\) (\d+)%, var\(--palette-([a-z]+)\)\)$/);
  if (mix) return mixRgb(palette[`palette-${mix[1]}`], palette[`palette-${mix[3]}`], Number(mix[2]) / 100);
  throw new Error(`Unsupported token value: ${value}`);
}

const themes = {
  light: declarations(block(':root,\n[data-theme="dark"] .scope-inverse')),
  dark: declarations(block('[data-theme="dark"],\n:root:not')),
};

const TEXT = 4.5;
const UI = 3;

// [foreground, background, minimum]
const PAIRS: [string, string, number][] = [
  ["foreground", "background", TEXT],
  ["foreground", "surface", TEXT],
  ["muted", "background", TEXT],
  ["muted", "surface", TEXT],
  ["label", "background", TEXT],
  ["label", "surface", TEXT],
  ["on-accent", "accent", TEXT],
  ["on-inverse", "inverse", TEXT],
  ["line-strong", "background", UI],
  ["line-strong", "surface", UI],
  ["focus", "background", UI],
  ["focus", "surface", UI],
];

describe.each(Object.entries(themes))("%s theme tokens", (_, tokens) => {
  it.each(PAIRS)("%s on %s ≥ %d:1", (fg, bg, min) => {
    const ratio = contrastRatio(resolve(tokens[fg]), resolve(tokens[bg]));
    expect(ratio).toBeGreaterThanOrEqual(min);
  });

  it("accent core lines on the page ground ≥ 3:1 (graphics)", () => {
    expect(contrastRatio(resolve(tokens.accent), resolve(tokens.background))).toBeGreaterThanOrEqual(UI);
  });
});

describe("brand reference ratios from the guidelines", () => {
  it.each([
    ["ivory", "aubergine", 16.5],
    ["lavender", "aubergine", 10.1],
    ["white", "violet", 4.8],
    ["violet", "ivory", 4.3],
    ["violet", "aubergine", 3.8],
  ])("%s on %s ≈ %d:1", (a, b, expected) => {
    expect(contrastRatio(palette[`palette-${a}`], palette[`palette-${b}`])).toBeCloseTo(expected, 0);
  });
});
