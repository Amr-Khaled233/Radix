import { z } from "@/lib/zod";
import { localizedRichSchema, localizedSchema } from "@/lib/localized";
import { slugSchema } from "@/lib/slug";
import { ICON_NAMES } from "@/components/brand/icon";

/** Shared client/server schemas for dashboard content forms. */

const L = localizedSchema;
const emptyL = { en: "", ar: "" };
const nullableId = z.uuid().nullable();

/** Localized text with the English value required. */
export const requiredEn = L.refine((value) => value.en.trim().length > 0, { message: "requiredEn", path: ["en"] });

export const seoFields = {
  seoTitle: L.default(emptyL),
  seoDescription: L.default(emptyL),
  ogImageId: nullableId.default(null),
};

export const categoryCreateSchema = z.object({
  slug: slugSchema,
  name: requiredEn,
});

export const categoryFormSchema = z.object({
  slug: slugSchema,
  name: requiredEn,
  tagline: L,
  description: localizedRichSchema,
  iconKey: z.enum(ICON_NAMES as [string, ...string[]]),
  isVisible: z.boolean(),
  showInNav: z.boolean(),
  showOnHome: z.boolean(),
  arReviewed: z.boolean(),
  ...seoFields,
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const serviceFormSchema = z.object({
  name: requiredEn,
  description: L.default(emptyL),
  isVisible: z.boolean().default(true),
});

export const PROJECT_STATUSES = ["draft", "published", "archived"] as const;

export const projectFormSchema = z.object({
  slug: slugSchema,
  title: requiredEn,
  clientName: L,
  summary: L,
  body: localizedRichSchema,
  coverImageId: nullableId,
  year: z.number().int().min(1900).max(2200).nullable(),
  externalUrl: z.union([z.url({ protocol: /^https?$/ }), z.literal("")]).nullable(),
  status: z.enum(PROJECT_STATUSES),
  isFeatured: z.boolean(),
  publishedAt: z.string().nullable(),
  categoryIds: z.array(z.uuid()),
  serviceIds: z.array(z.uuid()),
  gallery: z.array(z.object({ mediaId: z.uuid(), caption: L })),
  results: z.array(z.object({ value: z.string().trim().min(1, "required").max(40), label: L })),
  team: z.array(z.object({ teamMemberId: z.uuid(), role: L })),
  arReviewed: z.boolean(),
  ...seoFields,
});
export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const LINK_TYPES = ["website", "linkedin", "instagram", "behance", "dribbble", "x", "github", "other"] as const;

export const teamFormSchema = z.object({
  slug: slugSchema,
  name: requiredEn,
  role: L,
  shortBio: L,
  bio: localizedRichSchema,
  photoId: nullableId,
  email: z.union([z.email(), z.literal("")]).nullable(),
  showEmail: z.boolean(),
  links: z.array(z.object({ type: z.enum(LINK_TYPES), url: z.url({ protocol: /^https?$/ }) })),
  categoryIds: z.array(z.uuid()),
  isVisible: z.boolean(),
  showOnHome: z.boolean(),
  arReviewed: z.boolean(),
});
export type TeamFormValues = z.infer<typeof teamFormSchema>;
