import { z } from "@/lib/zod";
import { localizedRichSchema, localizedSchema } from "@/lib/db/localized";

/**
 * One zod schema per `settings` key (spec §5). Values are validated on every
 * write and parsed on read; `arNeedsReview` drives the dashboard badge for
 * seeded Arabic drafts.
 */

const L = localizedSchema;
const emptyL = { en: "", ar: "" };
const review = { arNeedsReview: z.boolean().default(false) };

export const generalSchema = z.object({
  email: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  address: L.default(emptyL),
  socials: z.array(z.object({ type: z.string().trim().min(1), url: z.url() })).default([]),
  analyticsEnabled: z.boolean().default(false),
  ...review,
});

export const seoSchema = z.object({
  titleTemplate: z.string().default("%s — RADIX"),
  defaultTitle: L.default(emptyL),
  defaultDescription: L.default(emptyL),
  defaultOgImageId: z.uuid().nullable().default(null),
  ...review,
});

export const HOME_SECTIONS = [
  "hero",
  "pillars",
  "positioning",
  "featuredWork",
  "process",
  "teamPreview",
  "closingCta",
] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

export const homeSchema = z.object({
  sections: z
    .array(z.object({ key: z.enum(HOME_SECTIONS), visible: z.boolean() }))
    .default(HOME_SECTIONS.map((key) => ({ key, visible: true }))),
  hero: z
    .object({ label: L, headline: L, body: L, primaryCta: L, secondaryCta: L })
    .default({ label: emptyL, headline: emptyL, body: emptyL, primaryCta: emptyL, secondaryCta: emptyL }),
  pillars: z.object({ label: L, heading: L }).default({ label: emptyL, heading: emptyL }),
  positioning: z
    .object({ label: L, heading: L, disciplines: z.array(L) })
    .default({ label: emptyL, heading: emptyL, disciplines: [] }),
  featuredWork: z.object({ label: L, heading: L }).default({ label: emptyL, heading: emptyL }),
  process: z.object({ label: L, heading: L }).default({ label: emptyL, heading: emptyL }),
  teamPreview: z.object({ label: L, heading: L }).default({ label: emptyL, heading: emptyL }),
  closingCta: z.object({ statement: L, cta: L }).default({ statement: emptyL, cta: emptyL }),
  ...review,
});

const titled = z.object({ title: L, body: L });

export const aboutSchema = z.object({
  intro: z.object({ statement: L, body: L }),
  meaning: z.object({ label: L, word: L, body: L, points: z.array(titled) }),
  essence: z.object({ label: L, headline: L, body: L }),
  coreIdea: z.object({ headline: L, pillars: z.array(titled) }),
  purpose: L,
  vision: L,
  mission: L,
  promise: z.array(z.object({ title: L, line: L })),
  values: z.array(titled),
  personality: z.object({ is: L, isNot: L }),
  problem: z.object({ label: L, headline: L, body: L }),
  audiences: z.array(titled),
  narrative: z.object({ headline: L, paragraphs: z.array(L) }),
  ...review,
});

export const processSchema = z.object({
  steps: z.array(z.object({ title: L, description: L })).default([]),
  ...review,
});

export const legalSchema = z.object({
  privacyTitle: L.default({ en: "Privacy policy", ar: "سياسة الخصوصية" }),
  privacyBody: localizedRichSchema.default({ en: null, ar: null }),
  updatedAt: z.string().nullable().default(null),
  ...review,
});

export const contactSchema = z.object({
  notificationEmails: z.array(z.email()).default([]),
});

export const localeSchema = z.object({
  defaultLocale: z.enum(["en", "ar"]).default("en"),
  arabicDigits: z.enum(["western", "arabic-indic"]).default("western"),
});

export const footerSchema = z.object({
  text: L.default(emptyL),
  ...review,
});

// ---------------------------------------------------------------------------
// Hero animation (spec §4A)
// ---------------------------------------------------------------------------

export const HERO_MODES = ["scrub", "frames", "loop", "static"] as const;
const focal = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });

export const heroBeatSchema = z.object({
  id: z.string(),
  text: L,
  style: z.enum(["label", "display", "h2", "body"]),
  position: z.object({ inline: z.enum(["start", "center", "end"]), block: z.enum(["top", "middle", "bottom"]) }),
  from: z.number().min(0).max(100),
  to: z.number().min(0).max(100),
  visible: z.boolean().default(true),
});

export const heroConfigSchema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(HERO_MODES).default("scrub"),
  assets: z
    .object({
      desktopMp4: z.uuid().nullable().default(null),
      desktopWebm: z.uuid().nullable().default(null),
      mobileMp4: z.uuid().nullable().default(null),
      posterDesktop: z.uuid().nullable().default(null),
      posterMobile: z.uuid().nullable().default(null),
      arVideo: z.uuid().nullable().default(null),
    })
    .default({
      desktopMp4: null,
      desktopWebm: null,
      mobileMp4: null,
      posterDesktop: null,
      posterMobile: null,
      arVideo: null,
    }),
  frames: z
    .object({ desktop: z.uuid().nullable().default(null), mobile: z.uuid().nullable().default(null) })
    .default({ desktop: null, mobile: null }),
  scrollLength: z
    .object({ desktop: z.number().min(150).max(600).default(300), mobile: z.number().min(100).max(400).default(200) })
    .default({ desktop: 300, mobile: 200 }),
  trim: z
    .object({ start: z.number().min(0).default(0), end: z.number().nullable().default(null) })
    .default({ start: 0, end: null }),
  introAutoplayTo: z.number().min(0).max(100).nullable().default(null),
  smoothing: z.number().min(0).max(1).default(0.15),
  fit: z.enum(["cover", "contain"]).default("cover"),
  focal: z
    .object({ desktop: focal, mobile: focal })
    .default({ desktop: { x: 0.5, y: 0.5 }, mobile: { x: 0.5, y: 0.5 } }),
  overlayOpacity: z.number().min(0).max(80).default(40),
  beats: z.array(heroBeatSchema).default([]),
  toggles: z
    .object({ scrollHint: z.boolean(), skipLink: z.boolean(), exitSurfaceLine: z.boolean() })
    .default({ scrollHint: true, skipLink: true, exitSurfaceLine: true }),
  allowLoopOnSaveData: z.boolean().default(false),
});
export type HeroConfig = z.infer<typeof heroConfigSchema>;

export const heroSchema = z.object({
  current: heroConfigSchema.default(heroConfigSchema.parse({})),
  previous: heroConfigSchema.nullable().default(null),
  ...review,
});

export const SETTINGS_SCHEMAS = {
  general: generalSchema,
  seo: seoSchema,
  home: homeSchema,
  about: aboutSchema,
  process: processSchema,
  legal: legalSchema,
  contact: contactSchema,
  locale: localeSchema,
  footer: footerSchema,
  hero: heroSchema,
} as const;

export type SettingsKey = keyof typeof SETTINGS_SCHEMAS;
export type SettingsValue<K extends SettingsKey> = z.infer<(typeof SETTINGS_SCHEMAS)[K]>;
