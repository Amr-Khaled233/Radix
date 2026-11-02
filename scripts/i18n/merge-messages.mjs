/**
 * Deep-merges a message patch `{ en: {...}, ar: {...} }` into messages/*.json.
 * Usage: node scripts/i18n/merge-messages.mjs path/to/patch.json
 * Fails if the patch's EN and AR key sets differ (every UI string needs both).
 */
import { readFileSync, writeFileSync } from "node:fs";

const patch = JSON.parse(readFileSync(process.argv[2], "utf8"));

function keys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

const en = new Set(keys(patch.en));
const ar = new Set(keys(patch.ar));
const missing = [...en].filter((k) => !ar.has(k)).concat([...ar].filter((k) => !en.has(k)));
if (missing.length) {
  console.error("EN/AR key mismatch:", missing.join(", "));
  process.exit(1);
}

function merge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === "object" && !Array.isArray(v)) target[k] = merge(target[k] ?? {}, v);
    else target[k] = v;
  }
  return target;
}

for (const locale of ["en", "ar"]) {
  const file = `messages/${locale}.json`;
  const json = JSON.parse(readFileSync(file, "utf8"));
  writeFileSync(file, JSON.stringify(merge(json, patch[locale]), null, 2) + "\n");
}
console.log(`merged ${en.size} keys`);
