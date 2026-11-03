/**
 * Brand copy, based on docs/brand-content.md. Owner revision (Nov 2026): the
 * third pillar is "Sites & Systems" (websites moved from Digital, AI production
 * moved to Growth) and the Arabic was edited for natural phrasing.
 * English is final. Arabic strings are drafts — they are seeded with
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
    ar: "متجذّرون في الاستراتيجية، نبني من أجل النمو.",
  },
  descriptor: {
    en: "Integrated creative & digital solutions",
    ar: "حلول إبداعية ورقمية متكاملة",
  },
  heroBody: {
    en: "We connect strategy, creativity, and technology to build the foundations for meaningful business growth.",
    ar: "نجمع الاستراتيجية والإبداع والتقنية لنبني الأسس التي يقوم عليها نموّ حقيقي للأعمال.",
  },
} satisfies Record<string, LocalizedText>;

export type SeedCategory = {
  slug: string;
  icon: Extract<IconName, "brand" | "digital" | "intelligence" | "growth">;
  name: LocalizedText;
  tagline: LocalizedText;
  services: LocalizedText[];
};

export const seedCategories: SeedCategory[] = [
  {
    slug: "brand",
    icon: "brand",
    name: { en: "Brand", ar: "الهوية" },
    tagline: { en: "Build from the Core.", ar: "نبني من الجوهر." },
    services: [
      { en: "Brand strategy", ar: "استراتيجية العلامة التجارية" },
      { en: "Naming", ar: "اختيار الاسم" },
      { en: "Logo design for new clients", ar: "تصميم الشعار للعلامات الجديدة" },
      { en: "Brand identity systems", ar: "أنظمة الهوية" },
      { en: "Visual identity", ar: "الهوية البصرية" },
      { en: "Brand guidelines", ar: "دليل استخدام الهوية" },
      { en: "Packaging", ar: "تصميم العبوات" },
      { en: "Brand applications", ar: "تطبيقات الهوية" },
      { en: "Art direction", ar: "الإدارة الفنية" },
      { en: "Brand communication systems", ar: "أنظمة تواصل العلامة" },
    ],
  },
  {
    slug: "digital",
    icon: "digital",
    name: { en: "Digital", ar: "التجارب الرقمية" },
    tagline: { en: "Turn Ideas into Experiences.", ar: "نحوّل الأفكار إلى تجارب." },
    services: [
      { en: "UI/UX design", ar: "تصميم الواجهات وتجربة المستخدم" },
      { en: "Digital product design", ar: "تصميم المنتجات الرقمية" },
      { en: "SaaS interfaces", ar: "واجهات منصات SaaS" },
      { en: "Responsive experiences", ar: "تجارب تعمل على كل الشاشات" },
      { en: "Digital platforms", ar: "المنصات الرقمية" },
    ],
  },
  {
    slug: "sites-and-systems",
    icon: "intelligence",
    name: { en: "Sites & Systems", ar: "المواقع والأنظمة" },
    tagline: { en: "Build What Runs the Business.", ar: "نبني ما يُدير أعمالك." },
    services: [
      { en: "Website design", ar: "تصميم المواقع" },
      { en: "Website development", ar: "تطوير المواقع" },
      { en: "Landing pages", ar: "صفحات الهبوط" },
      { en: "SaaS solutions", ar: "حلول SaaS" },
      { en: "Digital tools and systems", ar: "أدوات وأنظمة رقمية مخصّصة" },
      { en: "Workflow automation", ar: "أتمتة سير العمل" },
      { en: "AI integration", ar: "دمج الذكاء الاصطناعي" },
      { en: "Business process improvement", ar: "تحسين العمليات التشغيلية" },
    ],
  },
  {
    slug: "growth",
    icon: "growth",
    name: { en: "Growth", ar: "النموّ" },
    tagline: { en: "Grow with Purpose.", ar: "ننمو بهدف." },
    services: [
      { en: "Social media management", ar: "إدارة حسابات التواصل الاجتماعي" },
      { en: "Content strategy", ar: "استراتيجية المحتوى" },
      { en: "Social media design", ar: "تصميم محتوى التواصل الاجتماعي" },
      { en: "Digital campaigns", ar: "الحملات الرقمية" },
      { en: "Creative production", ar: "الإنتاج الإبداعي" },
      { en: "AI-powered video production", ar: "إنتاج الفيديو بالذكاء الاصطناعي" },
      { en: "AI-assisted creative production", ar: "الإنتاج الإبداعي بمساعدة الذكاء الاصطناعي" },
      { en: "Content development", ar: "صناعة المحتوى" },
      { en: "Brand communication", ar: "تواصل العلامة" },
      { en: "Digital growth initiatives", ar: "مبادرات النمو الرقمي" },
    ],
  },
];

export const seedProcessSteps: LocalizedText[] = [
  { en: "Discover", ar: "نكتشف" },
  { en: "Define", ar: "نحدّد" },
  { en: "Build", ar: "نبني" },
  { en: "Grow", ar: "ننمو" },
];
