// Build the Brand case-study images from Mahmoud Hwary's original portfolio material (with his consent).
//   node scripts/content/portfolio/build.mjs [path/to/hwary_portfolio]   (default: ./hwary_portfolio)
//
// The source folder (his portfolio site and its assets/) is not committed. Output: images/*.webp + capture.json.
// - Photographs and mockups are used as they are.
// - Applications that only exist as tiles on his page are captured one by one (his fixed header hidden,
//   rounded corners kept transparent).
// - Logos and tiles sit on one plate in the RADIX palette (Ivory or Aubergine) with an even margin, so every
//   project reads as one system on the site. Covers are 16:9 and safe to crop to 16:10 (the cards).
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SRC = path.resolve(process.argv[2] ?? "hwary_portfolio");
const A = (f) => path.join(SRC, "assets", f);
const OUT = "scripts/content/portfolio/images";
if (!existsSync(path.join(SRC, "index.html"))) throw new Error(`Portfolio source not found at ${SRC}`);

const IVORY = "#F6F3EE";
const AUBERGINE = "#1B1028";
const W = 1920;

// ---------------------------------------------------------------- tiles from the portfolio page
const SECTIONS = {
  reve: "#reve",
  bakebake: "#bakebake",
  levelup: "#levelup",
  nas: "#nas",
  gamestation: ".gamestation-cs",
  fawzi: ".fawzi-cs",
  paula: "#paula",
};
/** Captured tiles: { "<key>-<index>": { png, radius } } (index = order of the outermost framed boxes). */
const tiles = {};
async function captureTiles() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(path.join(SRC, "index.html")).href, { waitUntil: "networkidle", timeout: 120_000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
  await page.addStyleTag({ content: "*{animation-play-state:paused!important;transition:none!important}" });
  // His fixed header and side rails would otherwise land inside the captures.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("body *")) {
      const s = getComputedStyle(el);
      if (s.position === "fixed" || s.position === "sticky") el.style.setProperty("display", "none", "important");
    }
  });
  for (const [key, sel] of Object.entries(SECTIONS)) {
    const radii = await page.evaluate((sel) => {
      const root = document.querySelector(sel);
      const all = [...root.querySelectorAll("*")].filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        if (r.width < 220 || r.height < 160 || r.width > 1300) return false;
        const framed =
          parseFloat(s.borderRadius) > 0 ||
          s.backgroundImage !== "none" ||
          (s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "transparent") ||
          el.tagName === "IMG";
        return framed && s.visibility !== "hidden" && s.opacity !== "0";
      });
      const keep = all.filter((el) => !all.some((o) => o !== el && o.contains(el)));
      return keep.map((el, i) => {
        el.setAttribute("data-tile", `${i}`);
        return parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      });
    }, sel);
    for (let i = 0; i < radii.length; i++) {
      const el = page.locator(`${sel} [data-tile="${i}"]`);
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      tiles[`${key}-${i}`] = { png: await el.screenshot(), radius: radii[i] * 2 };
    }
  }
  await browser.close();
}

/** A tile with its rounded corners made transparent (so it sits cleanly on the plate). */
async function tile(id) {
  const t = tiles[id];
  if (!t) throw new Error(`Tile ${id} not found`);
  const { width, height } = await sharp(t.png).metadata();
  if (!t.radius) return t.png;
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${t.radius}" ry="${t.radius}" fill="#fff"/></svg>`,
  );
  return sharp(t.png).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

// ---------------------------------------------------------------- composition
/**
 * Place one or more images in a row, centred on a plate.
 * ratio: plate width/height (default: fits the content plus the margin); margin: fraction of the plate width.
 */
async function plate(inputs, { bg = IVORY, ratio, margin = 0.08, gap = 0.025, maxH = 0.84 } = {}) {
  const bufs = await Promise.all(inputs.map(async (i) => (Buffer.isBuffer(i) ? i : sharp(i).png().toBuffer())));
  const metas = await Promise.all(bufs.map((b) => sharp(b).metadata()));
  const pad = Math.round(W * margin);
  const g = Math.round(W * gap);
  const innerW = W - 2 * pad - g * (bufs.length - 1);
  // Same height for every item in the row, as large as the width allows.
  let h = innerW / metas.reduce((s, m) => s + m.width / m.height, 0);
  const H = ratio ? Math.round(W / ratio) : Math.round(h + 2 * pad);
  // On a fixed-ratio plate the vertical margin follows the plate height.
  const padY = ratio ? Math.round(H * margin) : pad;
  h = Math.min(h, H * maxH, H - 2 * padY);
  const widths = metas.map((m) => Math.round((h * m.width) / m.height));
  const total = widths.reduce((s, w) => s + w, 0) + g * (bufs.length - 1);
  let x = Math.round((W - total) / 2);
  const y = Math.round((H - h) / 2);
  const layers = [];
  for (const [i, b] of bufs.entries()) {
    layers.push({ input: await sharp(b).resize(widths[i], Math.round(h)).png().toBuffer(), left: x, top: y });
    x += widths[i] + g;
  }
  return sharp({ create: { width: W, height: H, channels: 3, background: bg } }).composite(layers).png().toBuffer();
}
/** A photograph or mockup as it is (at most 1920 px wide). */
const photo = (file) => sharp(A(file)).resize({ width: W, withoutEnlargement: true }).png().toBuffer();
/** A repeat pattern tiled across a 16:10 plate. */
async function pattern(file, scale = 0.5) {
  const m = await sharp(A(file)).metadata();
  const t = await sharp(A(file)).resize(Math.round(m.width * scale)).png().toBuffer();
  return sharp({ create: { width: W, height: 1200, channels: 3, background: IVORY } })
    .composite([{ input: t, tile: true, left: 0, top: 0 }])
    .png()
    .toBuffer();
}
const COVER = { ratio: 16 / 9, margin: 0.14 };

/** cover + gallery, in order. Each entry is a function returning a PNG buffer. */
const PROJECTS = {
  genz: {
    cover: () => photo("tote.jpg"),
    gallery: [
      () => plate([A("logo-genz.png")], { margin: 0.16, ratio: 16 / 9 }),
      () => plate([A("logo-arabic.png")], { margin: 0.16, ratio: 16 / 9 }),
      () => photo("editorial-hoodie.jpg"),
      () => photo("editorial-tee.jpg"),
      () => photo("hangtags.jpg"),
      () => photo("website.jpg"),
      () => photo("tee.jpg"),
      () => photo("socks.jpg"),
      () => photo("box.jpg"),
      () => photo("cap.jpg"),
    ],
  },
  reve: {
    cover: () => photo("reve/mockup1.jpg"),
    gallery: [
      () => plate([A("reve/logo.svg")], { margin: 0.2, ratio: 16 / 9 }),
      () => plate([A("reve/mark-white.png")], { bg: AUBERGINE, margin: 0.2, ratio: 16 / 9 }),
      () => photo("reve/mockup3.jpg"),
      () => photo("reve/mockup2.jpg"),
      () => photo("reve/card.jpg"),
      () => photo("reve/mockup4.jpg"),
      () => photo("reve/letterhead.jpg"),
      () => photo("reve/envelope.jpg"),
      () => photo("reve/mockup6.jpg"),
      () => photo("reve/pillow.jpg"),
      () => photo("reve/mockup5.jpg"),
      async () => plate([await tile("reve-1"), await tile("reve-10")]),
    ],
  },
  bakebake: {
    cover: () => plate([A("bakebake/bakebake-logo.png")], COVER),
    gallery: [
      async () => plate([A("bakebake/bakebake-logo-white.png")], { bg: AUBERGINE, margin: 0.16, ratio: 16 / 9 }),
      () => pattern("bakebake/wrap-loaf.png", 0.6),
      () => pattern("bakebake/wrap-argyle.png", 0.6),
      async () => plate([await tile("bakebake-1"), await tile("bakebake-2")]),
      async () => plate([await tile("bakebake-3")]),
      async () => plate([await tile("bakebake-4")]),
      async () => plate([await tile("bakebake-5"), await tile("bakebake-6")]),
    ],
  },
  levelup: {
    cover: async () => plate([await tile("levelup-10")], { ...COVER, bg: AUBERGINE }),
    gallery: [
      () => plate([A("levelup/level-up-logo-lockup.png")], { bg: AUBERGINE, margin: 0.16, ratio: 16 / 9 }),
      async () => plate([await tile("levelup-7"), await tile("levelup-8")], { bg: AUBERGINE }),
      async () => plate([await tile("levelup-9")], { bg: AUBERGINE }),
      async () => plate([await tile("levelup-10")], { bg: AUBERGINE }),
      async () => plate([await tile("levelup-11")], { bg: AUBERGINE }),
    ],
  },
  upperegypt: {
    cover: () => plate([A("upperegypt/logo-full.png")], COVER),
    gallery: [
      () => plate([A("upperegypt/symbol-official.png")], { bg: AUBERGINE, margin: 0.2, ratio: 16 / 9 }),
      () =>
        plate([A("upperegypt/prod-mix.png"), A("upperegypt/prod-okra.png"), A("upperegypt/prod-peas.png")], {
          margin: 0.06,
        }),
      () => photo("upperegypt/prod-mix.png"),
      () => photo("upperegypt/prod-okra.png"),
      () => photo("upperegypt/prod-peas.png"),
      () => plate([A("upperegypt/grid-crop.png")], { bg: AUBERGINE }),
    ],
  },
  nas: {
    cover: () => plate([A("nas/nas-symbol.png")], { ...COVER, bg: AUBERGINE, margin: 0.2 }),
    gallery: [
      () => plate([A("nas/nas-logo.png")], { bg: AUBERGINE, margin: 0.16, ratio: 16 / 9 }),
      async () => plate([await tile("nas-0")], { bg: AUBERGINE }),
      async () => plate([await tile("nas-1"), await tile("nas-2")], { bg: AUBERGINE }),
      async () => plate([await tile("nas-3")], { bg: AUBERGINE }),
      async () => plate([await tile("nas-4")], { bg: AUBERGINE }),
      async () => plate([await tile("nas-5")], { bg: AUBERGINE }),
    ],
  },
  gamestation: {
    cover: async () => plate([await tile("gamestation-1")], { ...COVER, bg: AUBERGINE }),
    gallery: [
      () => plate([A("gamestation/logo.png")], { margin: 0.2, ratio: 16 / 9 }),
      async () => plate([await tile("gamestation-1")], { bg: AUBERGINE }),
      async () =>
        plate(
          [await tile("gamestation-3"), await tile("gamestation-4"), await tile("gamestation-5"), await tile("gamestation-6")],
          { bg: AUBERGINE, gap: 0.015 },
        ),
    ],
  },
  fawzi: {
    cover: async () => plate([await tile("fawzi-4")], COVER),
    gallery: [
      () => plate([A("fawzi/logo-red.png")], { margin: 0.16, ratio: 16 / 9 }),
      () => plate([A("fawzi/logo-white.png")], { bg: AUBERGINE, margin: 0.16, ratio: 16 / 9 }),
      async () => plate([await tile("fawzi-1"), await tile("fawzi-2")]),
      async () => plate([await tile("fawzi-3")]),
      async () => plate([await tile("fawzi-4")]),
      async () => plate([await tile("fawzi-0"), await tile("fawzi-5")]),
    ],
  },
  paula: {
    cover: () => plate([A("paula/paula-logo-horizontal.png")], COVER),
    gallery: [
      () => plate([A("paula/paula-icon.png")], { bg: AUBERGINE, margin: 0.16, ratio: 16 / 9 }),
      () => plate([A("paula/paula-logo-stacked.png")], { margin: 0.12, ratio: 16 / 9 }),
      async () =>
        plate([await tile("paula-8"), await tile("paula-9"), await tile("paula-10"), await tile("paula-11")], {
          gap: 0.015,
        }),
      async () => plate([await tile("paula-12")]),
      async () => plate([await tile("paula-13"), await tile("paula-14")], { margin: 0.05 }),
      async () => plate([await tile("paula-15"), await tile("paula-16"), await tile("paula-17")], { gap: 0.015, margin: 0.05 }),
    ],
  },
};

// ---------------------------------------------------------------- run
await captureTiles();
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f !== "mahmoud-hwary.webp") rmSync(path.join(OUT, f));
const toWebp = (png, file) => sharp(png).webp({ quality: 84 }).toFile(path.join(OUT, file));
const capture = {};
for (const [key, project] of Object.entries(PROJECTS)) {
  await toWebp(await project.cover(), `${key}-cover.webp`);
  capture[`${key}:cover`] = `${key}-cover.webp`;
  capture[key] = [];
  for (const [i, make] of project.gallery.entries()) {
    const file = `${key}-${String(i + 1).padStart(2, "0")}.webp`;
    await toWebp(await make(), file);
    capture[key].push(file);
  }
  console.log(key, 1 + capture[key].length, "images");
}
capture.portrait = ["mahmoud-hwary.webp"];
writeFileSync("scripts/content/portfolio/capture.json", JSON.stringify(capture, null, 2) + "\n");
