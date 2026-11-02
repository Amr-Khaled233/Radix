/**
 * Cache tags shared by public data reads (`cacheTag`, Phase 4) and dashboard
 * mutations (`updateTag`). Locale-independent: one tag covers /en and /ar.
 */
export const TAGS = {
  categories: "categories",
  category: (slug: string) => `category:${slug}`,
  projects: "projects",
  project: (slug: string) => `project:${slug}`,
  team: "team",
  teamMember: (slug: string) => `team:${slug}`,
  media: "media",
  settings: (key: string) => `settings:${key}`,
} as const;
