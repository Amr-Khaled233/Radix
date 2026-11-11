// Capture case-study images from Mahmoud Hwary's portfolio (team member, consented).
// Output: scripts/content/portfolio/images/*.webp + capture.json (files per project).
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const SITE = "https://www.mahmoudhwaryportfolio.com/";
const OUT = "scripts/content/portfolio/images";
mkdirSync(OUT, { recursive: true });

const SECTIONS = {
  genz: "#genz",
  reve: "#reve",
  bakebake: "#bakebake",
  levelup: "#levelup",
  upperegypt: "#upperegypt",
  nas: "#nas",
  gamestation: ".gamestation-cs",
  fawzi: ".fawzi-cs",
  paula: "#paula",
};
/** Real mockup photos on the portfolio (used as the gallery; the section only gives the cover). */
const PHOTOS = {
  genz: [
    "editorial-hoodie.jpg",
    "hangtags.jpg",
    "tote.jpg",
    "website.jpg",
    "tee.jpg",
    "socks.jpg",
    "editorial-tee.jpg",
    "box.jpg",
    "cap.jpg",
  ],
  reve: [
    "reve/mockup1.jpg",
    "reve/mockup3.jpg",
    "reve/card.jpg",
    "reve/mockup2.jpg",
    "reve/mockup4.jpg",
    "reve/envelope.jpg",
    "reve/mockup6.jpg",
    "reve/letterhead.jpg",
    "reve/pillow.jpg",
    "reve/mockup5.jpg",
  ],
};

const toWebp = (input, file) => sharp(input).webp({ quality: 82 }).toFile(`${OUT}/${file}`);

/** Cut a tall screenshot into ~900px slices at rows of plain background (between blocks). */
async function slice(png, { target = 950, min = 560, max = 1450 } = {}) {
  const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const rowSpread = new Float64Array(height);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    let sq = 0;
    for (let x = 0; x < width; x += 4) {
      const v = data[y * width + x];
      sum += v;
      sq += v * v;
    }
    const n = Math.ceil(width / 4);
    rowSpread[y] = Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2));
  }
  const cuts = [0];
  while (height - cuts.at(-1) > max) {
    const start = cuts.at(-1);
    let best = start + target;
    let bestScore = Infinity;
    for (let y = start + min; y < Math.min(start + max, height - min); y++) {
      // Prefer a calm band of rows (a gap), close to the target height.
      let band = 0;
      for (let k = -6; k <= 6; k++) band = Math.max(band, rowSpread[Math.min(height - 1, Math.max(0, y + k))]);
      const score = band * 4 + Math.abs(y - (start + target)) / 60;
      if (score < bestScore) {
        bestScore = score;
        best = y;
      }
    }
    cuts.push(best);
  }
  cuts.push(height);
  const parts = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    parts.push(
      await sharp(png)
        .extract({ left: 0, top: cuts[i], width, height: cuts[i + 1] - cuts[i] })
        .png()
        .toBuffer(),
    );
  }
  return parts;
}

const capture = {};
const browser = await chromium.launch();
const page = await (
  await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
).newPage();
await page.goto(SITE, { waitUntil: "networkidle", timeout: 120_000 });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 80));
  }
  scrollTo(0, 0);
});
await page.waitForTimeout(2000);
await page.addStyleTag({
  content: "[data-reveal],.reveal{opacity:1!important;transform:none!important;filter:none!important}",
});
// Hide the portfolio's own fixed/sticky bars so they don't land in the captures.
await page.evaluate(() => {
  for (const el of document.querySelectorAll("body *")) {
    const pos = getComputedStyle(el).position;
    if (pos === "fixed" || pos === "sticky") el.style.setProperty("display", "none", "important");
  }
});
await page.waitForTimeout(500);

for (const [key, selector] of Object.entries(SECTIONS)) {
  const el = page.locator(selector).first();
  const full = await el.screenshot();
  const files = [];
  // Cover: the opening of the case study, cut at a gap near 16:10 (cards and the project header).
  const meta = await sharp(full).metadata();
  const coverTarget = Math.round((meta.width * 10) / 16);
  const [cover] = await slice(full, { target: coverTarget + 60, min: coverTarget, max: coverTarget + 260 });
  const coverHeight = (await sharp(cover).metadata()).height;
  await toWebp(cover, `${key}-cover.webp`);
  capture[`${key}:cover`] = `${key}-cover.webp`;
  // Gallery: the rest of the case study (photo projects use their photos instead), so nothing repeats.
  const rest =
    meta.height - coverHeight > 200
      ? await sharp(full)
          .extract({ left: 0, top: coverHeight, width: meta.width, height: meta.height - coverHeight })
          .png()
          .toBuffer()
      : null;
  // A one-screen case study stays whole (cutting it would split its last row of cards).
  const use = PHOTOS[key] ? [] : meta.height <= 1450 || !rest ? [full] : await slice(rest);
  for (const [i, part] of use.entries()) {
    const file = `${key}-${String(i + 1).padStart(2, "0")}.webp`;
    await toWebp(part, file);
    files.push(file);
  }
  for (const [i, path] of (PHOTOS[key] ?? []).entries()) {
    const res = await fetch(new URL(`assets/${path}`, SITE));
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    const file = `${key}-photo-${String(i + 1).padStart(2, "0")}.webp`;
    await toWebp(Buffer.from(await res.arrayBuffer()), file);
    files.push(file);
  }
  capture[key] = files;
  console.log(key, files.length);
}

const portrait = await fetch(new URL("assets/mahmoud-portrait.jpg", SITE));
await toWebp(Buffer.from(await portrait.arrayBuffer()), "mahmoud-hwary.webp");
capture.portrait = ["mahmoud-hwary.webp"];

writeFileSync("scripts/content/portfolio/capture.json", JSON.stringify(capture, null, 2) + "\n");
await browser.close();
