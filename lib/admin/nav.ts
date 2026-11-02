import { can, type Action, type Actor, type Resource } from "@/lib/auth/permissions";

export type NavKey =
  | "overview"
  | "categories"
  | "projects"
  | "team"
  | "pages"
  | "home"
  | "hero"
  | "about"
  | "process"
  | "privacy"
  | "footer"
  | "messages"
  | "media"
  | "admins"
  | "settings"
  | "auditLog";

export type NavItem = {
  key: NavKey;
  href: string;
  permission?: [Action, Resource];
  children?: NavItem[];
};

const NAV: NavItem[] = [
  { key: "overview", href: "/admin" },
  { key: "categories", href: "/admin/categories", permission: ["view", "categories"] },
  { key: "projects", href: "/admin/projects", permission: ["view", "projects"] },
  { key: "team", href: "/admin/team", permission: ["view", "team"] },
  {
    key: "pages",
    href: "/admin/pages/home",
    permission: ["view", "pages"],
    children: [
      { key: "home", href: "/admin/pages/home" },
      { key: "hero", href: "/admin/pages/hero" },
      { key: "about", href: "/admin/pages/about" },
      { key: "process", href: "/admin/pages/process" },
      { key: "privacy", href: "/admin/pages/privacy" },
      { key: "footer", href: "/admin/pages/footer" },
    ],
  },
  { key: "messages", href: "/admin/messages", permission: ["view", "messages"] },
  { key: "media", href: "/admin/media", permission: ["view", "media"] },
  { key: "admins", href: "/admin/admins", permission: ["view", "admins"] },
  { key: "settings", href: "/admin/settings", permission: ["view", "settings"] },
  { key: "auditLog", href: "/admin/audit-log", permission: ["view", "auditLog"] },
];

/** Navigation filtered to what the actor may open (the pages re-check on the server). */
export function navFor(actor: Actor): NavItem[] {
  return NAV.filter((item) => !item.permission || can(actor, ...item.permission));
}
