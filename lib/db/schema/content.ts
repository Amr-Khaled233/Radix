import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { localized, localizedRich } from "../localized";
import { user } from "./auth";

/** id, timestamps, authorship and the "Arabic needs review" flag shared by content tables. */
const contentColumns = () => ({
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: text().references(() => user.id, { onDelete: "set null" }),
  updatedBy: text().references(() => user.id, { onDelete: "set null" }),
  arNeedsReview: boolean().notNull().default(false),
});

const seoColumns = () => ({
  seoTitle: localized("seo_title"),
  seoDescription: localized("seo_description"),
  ogImageId: uuid().references(() => media.id, { onDelete: "set null" }),
});

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export const mediaKind = pgEnum("media_kind", ["image", "video"]);

export const media = pgTable(
  "media",
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: mediaKind().notNull(),
    url: text().notNull(),
    pathname: text().notNull(),
    contentType: text().notNull(),
    size: integer().notNull(),
    width: integer(),
    height: integer(),
    duration: real(),
    alt: localized("alt"),
    uploadedBy: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("media_kind_idx").on(table.kind), index("media_created_at_idx").on(table.createdAt)],
);

export const frameVariant = pgEnum("frame_variant", ["desktop", "mobile"]);

export const frameSequences = pgTable("frame_sequences", {
  id: uuid().primaryKey().defaultRandom(),
  sourceMediaId: uuid().references(() => media.id, { onDelete: "set null" }),
  variant: frameVariant().notNull(),
  basePath: text().notNull(),
  frameCount: integer().notNull(),
  fps: integer().notNull(),
  width: integer().notNull(),
  height: integer().notNull(),
  format: text().notNull().default("webp"),
  createdBy: text().references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Categories & services
// ---------------------------------------------------------------------------

export const categories = pgTable(
  "categories",
  {
    ...contentColumns(),
    slug: text().notNull(),
    name: localized("name"),
    tagline: localized("tagline"),
    description: localizedRich("description"),
    iconKey: text().notNull(),
    sortOrder: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    showInNav: boolean().notNull().default(true),
    showOnHome: boolean().notNull().default(true),
    ...seoColumns(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug), index("categories_sort_idx").on(table.sortOrder)],
);

export const services = pgTable(
  "services",
  {
    ...contentColumns(),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: localized("name"),
    description: localized("description"),
    sortOrder: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
  },
  (table) => [index("services_category_idx").on(table.categoryId, table.sortOrder)],
);

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export type TeamLink = { type: string; url: string };

export const teamMembers = pgTable(
  "team_members",
  {
    ...contentColumns(),
    slug: text().notNull(),
    name: localized("name"),
    role: localized("role"),
    shortBio: localized("short_bio"),
    bio: localizedRich("bio"),
    photoId: uuid().references(() => media.id, { onDelete: "set null" }),
    email: text(),
    showEmail: boolean().notNull().default(false),
    links: jsonb().$type<TeamLink[]>().notNull().default([]),
    sortOrder: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    showOnHome: boolean().notNull().default(false),
  },
  (table) => [uniqueIndex("team_members_slug_idx").on(table.slug), index("team_members_sort_idx").on(table.sortOrder)],
);

export const teamMemberCategories = pgTable(
  "team_member_categories",
  {
    teamMemberId: uuid()
      .notNull()
      .references(() => teamMembers.id, { onDelete: "cascade" }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.teamMemberId, table.categoryId] })],
);

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const projectStatus = pgEnum("project_status", ["draft", "published", "archived"]);

export const projects = pgTable(
  "projects",
  {
    ...contentColumns(),
    slug: text().notNull(),
    title: localized("title"),
    clientName: localized("client_name"),
    summary: localized("summary"),
    body: localizedRich("body"),
    coverImageId: uuid().references(() => media.id, { onDelete: "set null" }),
    year: integer(),
    externalUrl: text(),
    status: projectStatus().notNull().default("draft"),
    isFeatured: boolean().notNull().default(false),
    sortOrder: integer().notNull().default(0),
    publishedAt: timestamp({ withTimezone: true }),
    ...seoColumns(),
  },
  (table) => [
    uniqueIndex("projects_slug_idx").on(table.slug),
    index("projects_status_idx").on(table.status),
    index("projects_sort_idx").on(table.sortOrder),
  ],
);

export const projectCategories = pgTable(
  "project_categories",
  {
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    isFeaturedInCategory: boolean().notNull().default(false),
    sortOrder: integer().notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.categoryId] }),
    index("project_categories_category_idx").on(table.categoryId, table.sortOrder),
  ],
);

export const projectServices = pgTable(
  "project_services",
  {
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    serviceId: uuid()
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.serviceId] })],
);

export const projectMedia = pgTable(
  "project_media",
  {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    mediaId: uuid()
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    caption: localized("caption"),
    sortOrder: integer().notNull().default(0),
  },
  (table) => [index("project_media_project_idx").on(table.projectId, table.sortOrder)],
);

export const projectResults = pgTable(
  "project_results",
  {
    id: uuid().primaryKey().defaultRandom(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    value: text().notNull(),
    label: localized("label"),
    sortOrder: integer().notNull().default(0),
  },
  (table) => [index("project_results_project_idx").on(table.projectId, table.sortOrder)],
);

export const projectTeam = pgTable(
  "project_team",
  {
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    teamMemberId: uuid()
      .notNull()
      .references(() => teamMembers.id, { onDelete: "cascade" }),
    role: localized("role"),
    sortOrder: integer().notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.teamMemberId] })],
);

// ---------------------------------------------------------------------------
// Settings, messages, audit
// ---------------------------------------------------------------------------

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  updatedBy: text().references(() => user.id, { onDelete: "set null" }),
});

/**
 * Which dashboard accounts are responsible for which pillar. A responsible
 * account sees (and is emailed) the contact messages about that pillar.
 */
export const categoryAssignments = pgTable(
  "category_assignments",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.categoryId] }),
    index("category_assignments_category_idx").on(table.categoryId),
  ],
);

export const submissionStatus = pgEnum("submission_status", ["new", "read", "archived"]);

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull(),
    company: text(),
    phone: text(),
    message: text().notNull(),
    categoryIds: uuid().array().notNull().default([]),
    locale: text().notNull(),
    status: submissionStatus().notNull().default("new"),
    ipHash: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("contact_submissions_status_idx").on(table.status, table.createdAt)],
);

/** Fixed-window counters for public endpoints (contact form). Keys hold hashed IPs only. */
export const requestLimits = pgTable("request_limits", {
  key: text().primaryKey(),
  count: integer().notNull(),
  windowStart: timestamp({ withTimezone: true }).notNull(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid().primaryKey().defaultRandom(),
    actorId: text().references(() => user.id, { onDelete: "set null" }),
    action: text().notNull(),
    entityType: text().notNull(),
    entityId: text(),
    summary: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_created_at_idx").on(table.createdAt),
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
  ],
);
