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
      { en: "Naming", ar: "التسمية" },
      { en: "Logo design for new clients", ar: "تصميم الشعارات للعملاء الجدد" },
      { en: "Brand identity systems", ar: "أنظمة الهوية التجارية" },
      { en: "Visual identity", ar: "الهوية البصرية" },
      { en: "Brand guidelines", ar: "أدلة الهوية" },
      { en: "Packaging", ar: "التغليف" },
      { en: "Brand applications", ar: "تطبيقات الهوية" },
      { en: "Art direction", ar: "الإدارة الفنية" },
      { en: "Brand communication systems", ar: "أنظمة التواصل للعلامة التجارية" },
    ],
  },
  {
    slug: "digital",
    icon: "digital",
    name: { en: "Digital", ar: "الرقمي" },
    tagline: { en: "Turn Ideas into Experiences.", ar: "نحوّل الأفكار إلى تجارب." },
    services: [
      { en: "Website design", ar: "تصميم المواقع" },
      { en: "Website development", ar: "تطوير المواقع" },
      { en: "Landing pages", ar: "صفحات الهبوط" },
      { en: "UI/UX design", ar: "تصميم الواجهات وتجربة المستخدم (UI/UX)" },
      { en: "Digital product design", ar: "تصميم المنتجات الرقمية" },
      { en: "SaaS interfaces", ar: "واجهات SaaS" },
      { en: "Responsive experiences", ar: "تجارب متجاوبة" },
      { en: "Digital platforms", ar: "المنصات الرقمية" },
    ],
  },
  {
    slug: "intelligence",
    icon: "intelligence",
    name: { en: "Intelligence", ar: "الذكاء" },
    tagline: { en: "Make Technology Work Smarter.", ar: "نجعل التقنية تعمل بذكاء أكبر." },
    services: [
      { en: "AI-powered video production", ar: "إنتاج الفيديو بالذكاء الاصطناعي" },
      { en: "AI-assisted creative production", ar: "الإنتاج الإبداعي بمساعدة الذكاء الاصطناعي" },
      { en: "Intelligent digital systems", ar: "الأنظمة الرقمية الذكية" },
      { en: "Workflow automation", ar: "أتمتة سير العمل" },
      { en: "AI integration", ar: "دمج الذكاء الاصطناعي" },
      { en: "SaaS solutions", ar: "حلول SaaS" },
      { en: "Business process improvement", ar: "تحسين العمليات التشغيلية" },
      { en: "Digital tools and systems", ar: "الأدوات والأنظمة الرقمية" },
    ],
  },
  {
    slug: "growth",
    icon: "growth",
    name: { en: "Growth", ar: "النموّ" },
    tagline: { en: "Grow with Purpose.", ar: "نموّ له هدف." },
    services: [
      { en: "Social media management", ar: "إدارة وسائل التواصل الاجتماعي" },
      { en: "Content strategy", ar: "استراتيجية المحتوى" },
      { en: "Social media design", ar: "تصميم محتوى التواصل الاجتماعي" },
      { en: "Digital campaigns", ar: "الحملات الرقمية" },
      { en: "Creative production", ar: "الإنتاج الإبداعي" },
      { en: "Content development", ar: "تطوير المحتوى" },
      { en: "Brand communication", ar: "تواصل العلامة التجارية" },
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
