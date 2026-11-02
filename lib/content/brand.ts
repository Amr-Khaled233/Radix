/**
 * Brand copy transcribed from docs/brand-content.md.
 * English is final. Arabic strings are first drafts — they are seeded with
 * "Needs review" in the database (Phase 2) and edited from the dashboard.
 *
 * Until the database exists (Phase 2–4) the public layout reads from here.
 */
import type { IconName } from "@/components/brand/generated/icons";

export type LocalizedText = { en: string; ar: string };

export const brandCopy = {
  tagline: { en: "Where Growth Takes Root.", ar: "حيث يتجذّر النمو." },
  statement: {
    en: "Rooted in Strategy. Built for Growth.",
    ar: "جذورنا استراتيجية، وبناؤنا للنمو.",
  },
  descriptor: {
    en: "Integrated creative & digital solutions",
    ar: "حلول إبداعية ورقمية متكاملة",
  },
  heroBody: {
    en: "We connect strategy, creativity, and technology to build the foundations for meaningful business growth.",
    ar: "نربط الاستراتيجية والإبداع والتقنية لنبني الأسس التي يقوم عليها نموّ حقيقي للأعمال.",
  },
} satisfies Record<string, LocalizedText>;

export type SeedCategory = {
  slug: string;
  icon: Extract<IconName, "brand" | "digital" | "intelligence" | "growth">;
  name: LocalizedText;
  tagline: LocalizedText;
  services: string[];
};

export const seedCategories: SeedCategory[] = [
  {
    slug: "brand",
    icon: "brand",
    name: { en: "Brand", ar: "الهوية" },
    tagline: { en: "Build from the Core.", ar: "نبني من الجوهر." },
    services: [
      "Brand strategy",
      "Naming",
      "Logo design for new clients",
      "Brand identity systems",
      "Visual identity",
      "Brand guidelines",
      "Packaging",
      "Brand applications",
      "Art direction",
      "Brand communication systems",
    ],
  },
  {
    slug: "digital",
    icon: "digital",
    name: { en: "Digital", ar: "الرقمي" },
    tagline: { en: "Turn Ideas into Experiences.", ar: "نحوّل الأفكار إلى تجارب." },
    services: [
      "Website design",
      "Website development",
      "Landing pages",
      "UI/UX design",
      "Digital product design",
      "SaaS interfaces",
      "Responsive experiences",
      "Digital platforms",
    ],
  },
  {
    slug: "intelligence",
    icon: "intelligence",
    name: { en: "Intelligence", ar: "الذكاء" },
    tagline: { en: "Make Technology Work Smarter.", ar: "نجعل التقنية تعمل بذكاء أكبر." },
    services: [
      "AI-powered video production",
      "AI-assisted creative production",
      "Intelligent digital systems",
      "Workflow automation",
      "AI integration",
      "SaaS solutions",
      "Business process improvement",
      "Digital tools and systems",
    ],
  },
  {
    slug: "growth",
    icon: "growth",
    name: { en: "Growth", ar: "النموّ" },
    tagline: { en: "Grow with Purpose.", ar: "نموّ له هدف." },
    services: [
      "Social media management",
      "Content strategy",
      "Social media design",
      "Digital campaigns",
      "Creative production",
      "Content development",
      "Brand communication",
      "Digital growth initiatives",
    ],
  },
];

export const seedProcessSteps: LocalizedText[] = [
  { en: "Discover", ar: "نكتشف" },
  { en: "Define", ar: "نحدّد" },
  { en: "Build", ar: "نبني" },
  { en: "Grow", ar: "ننمو" },
];
