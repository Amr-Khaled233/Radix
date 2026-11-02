/**
 * Seeds brand content from docs/brand-content.md: the four categories with
 * their services, home/about/process copy and empty settings. English is
 * final copy; Arabic strings are drafts flagged "Needs review".
 *
 * Idempotent — existing categories (by slug) and settings keys are left untouched.
 * No projects, team members or testimonials are seeded (brand rule).
 */
import { eq } from "drizzle-orm";
import { brandCopy, seedCategories, seedProcessSteps, type LocalizedText as L } from "../../lib/content/brand";
import { categories, services, settings } from "../../lib/db/schema";
import { SETTINGS_SCHEMAS, type SettingsKey } from "../../lib/settings/schemas";
import { scriptDb } from "./client";

const both = (en: string, ar: string): L => ({ en, ar });

const about = {
  intro: {
    statement: both(
      "RADIX is an integrated creative and digital solutions company that builds the foundations businesses grow from.",
      "RADIX شركة حلول إبداعية ورقمية متكاملة، تبني الأسس التي تنمو منها الأعمال.",
    ),
    body: both(
      "RADIX brings strategy, design, and technology together to help businesses build strong brands, meaningful digital experiences, and intelligent systems, working as one connected partner.",
      "تجمع RADIX بين الاستراتيجية والتصميم والتقنية لتساعد الشركات على بناء علامات تجارية قوية وتجارب رقمية ذات معنى وأنظمة ذكية، كشريك واحد مترابط.",
    ),
  },
  meaning: {
    label: both("radix · Latin · noun", "radix · لاتينية · اسم"),
    word: both("root.", "جذر."),
    body: both(
      "The name comes from the Latin word for root. We use it to describe where our work happens: at the foundations of a business, where ideas become brands, digital experiences, and intelligent systems.",
      "الاسم مأخوذ من الكلمة اللاتينية التي تعني الجذر. نستخدمه لنصف المكان الذي يحدث فيه عملنا: عند أسس الأعمال، حيث تتحوّل الأفكار إلى علامات تجارية وتجارب رقمية وأنظمة ذكية.",
    ),
    points: [
      {
        title: both("Foundations", "الأسس"),
        body: both("Clear strategy before visible output.", "استراتيجية واضحة قبل أي نتيجة ظاهرة."),
      },
      {
        title: both("Connected systems", "أنظمة مترابطة"),
        body: both("Disciplines that share one structure.", "تخصصات تتشارك بنية واحدة."),
      },
      {
        title: both("Potential for growth", "قابلية النمو"),
        body: both("Work built to adapt and extend.", "عمل مبني ليتكيّف ويتوسّع."),
      },
    ],
  },
  essence: {
    label: both("Brand essence", "جوهر العلامة"),
    headline: both("Foundational Growth.", "نموّ يبدأ من الأساس."),
    body: both(
      "The single idea behind every RADIX decision: lasting growth depends on what is built underneath it.",
      "الفكرة الواحدة وراء كل قرار في RADIX: النموّ الدائم يعتمد على ما يُبنى تحته.",
    ),
  },
  coreIdea: {
    headline: both("Growth starts beneath the surface.", "النموّ يبدأ تحت السطح."),
    pillars: [
      {
        title: both("Strategy", "الاستراتيجية"),
        body: both("Knowing what to build and why.", "أن نعرف ماذا نبني ولماذا."),
      },
      { title: both("Systems", "الأنظمة"), body: both("Structures that scale.", "بنى قابلة للتوسّع.") },
      { title: both("Technology", "التقنية"), body: both("Tools that do real work.", "أدوات تؤدي عملًا حقيقيًا.") },
      { title: both("Craft", "الإتقان"), body: both("Detail that holds up.", "تفاصيل تصمد.") },
    ],
  },
  purpose: both(
    "To build the foundations that help businesses grow, adapt, and thrive in a changing digital world.",
    "أن نبني الأسس التي تساعد الشركات على النموّ والتكيّف والازدهار في عالم رقمي متغيّر.",
  ),
  vision: both(
    "To become a trusted creative and technology partner, helping businesses build strong foundations for sustainable digital growth.",
    "أن نكون شريكًا إبداعيًا وتقنيًا موثوقًا، يساعد الشركات على بناء أسس قوية لنموّ رقمي مستدام.",
  ),
  mission: both(
    "To transform business needs into meaningful creative and digital solutions through strategic thinking, purposeful design, and intelligent technology.",
    "أن نحوّل احتياجات الأعمال إلى حلول إبداعية ورقمية ذات معنى، من خلال التفكير الاستراتيجي والتصميم الهادف والتقنية الذكية.",
  ),
  promise: [
    { title: both("Build", "نبني"), line: both("We build with purpose,", "نبني بهدف،") },
    { title: both("Connect", "نتواصل"), line: both("connect with intention,", "ونتواصل بوعي،") },
    { title: both("Create", "نبدع"), line: both("and create for growth.", "ونبدع من أجل النموّ.") },
  ],
  values: [
    {
      title: both("Strong Foundations", "أسس متينة"),
      body: both(
        "Every solution starts from a clear strategic and practical base.",
        "كل حل يبدأ من قاعدة استراتيجية وعملية واضحة.",
      ),
    },
    {
      title: both("Purposeful Creativity", "إبداع هادف"),
      body: both("Creativity serves a meaningful objective.", "الإبداع في خدمة هدف له معنى."),
    },
    {
      title: both("Intelligent Innovation", "ابتكار ذكي"),
      body: both(
        "Technology and new methods are used where they are useful.",
        "نستخدم التقنية والأساليب الجديدة حيث تكون مفيدة.",
      ),
    },
    {
      title: both("Connected Thinking", "تفكير مترابط"),
      body: both(
        "Strategy, design, technology, and communication form one system.",
        "الاستراتيجية والتصميم والتقنية والتواصل تشكّل نظامًا واحدًا.",
      ),
    },
    {
      title: both("Continuous Growth", "نموّ مستمر"),
      body: both("Solutions are built to adapt and evolve.", "حلول مبنية لتتكيّف وتتطوّر."),
    },
    {
      title: both("Craft & Precision", "إتقان ودقة"),
      body: both("Every detail is part of the final experience.", "كل تفصيلة جزء من التجربة النهائية."),
    },
  ],
  personality: {
    is: both(
      "Intelligent. Strategic. Contemporary. Confident. Premium. Refined. Innovative. Adaptable. Purposeful. Technically capable. Creatively sophisticated. Commercially aware.",
      "ذكية. استراتيجية. معاصرة. واثقة. راقية. مصقولة. مبتكرة. مرنة. هادفة. متمكّنة تقنيًا. متطوّرة إبداعيًا. واعية تجاريًا.",
    ),
    isNot: both(
      "Childish · Cartoonish · Generic · Excessively futuristic · Overly luxurious · Aggressive · Noisy · Cheap · Visually chaotic · Artificially corporate · A generic AI startup · A template agency",
      "طفولية · كرتونية · عامة · مستقبلية بإفراط · فاخرة بإفراط · عدوانية · صاخبة · رخيصة · فوضوية بصريًا · مؤسسية بتكلّف · شركة ذكاء اصطناعي عامة · وكالة قوالب جاهزة",
    ),
  },
  problem: {
    label: both("The problem we address", "المشكلة التي نعالجها"),
    headline: both(
      "Brand, website, automation, and content are often handled by separate suppliers. The pieces rarely fit together.",
      "غالبًا ما يتولّى الهوية والموقع والأتمتة والمحتوى مورّدون منفصلون، ونادرًا ما تتكامل هذه الأجزاء.",
    ),
    body: both(
      "RADIX connects those disciplines from the start, so every output is built on the same foundation.",
      "تربط RADIX هذه التخصصات منذ البداية، فيُبنى كل ناتج على الأساس نفسه.",
    ),
  },
  audiences: [
    {
      title: both("Founders and leadership teams", "المؤسسون وفرق القيادة"),
      body: both(
        "Building or rebuilding a brand from its strategy up.",
        "يبنون علامة تجارية أو يعيدون بناءها بدءًا من استراتيجيتها.",
      ),
    },
    {
      title: both("Growing businesses", "الشركات النامية"),
      body: both("Needing a digital presence that matches their ambition.", "تحتاج إلى حضور رقمي يوازي طموحها."),
    },
    {
      title: both("Operations-minded teams", "الفرق التشغيلية"),
      body: both(
        "Looking for practical AI, automation, and digital tools.",
        "تبحث عن ذكاء اصطناعي وأتمتة وأدوات رقمية عملية.",
      ),
    },
    {
      title: both("Marketing teams", "فرق التسويق"),
      body: both(
        "Needing consistent content and campaigns over time.",
        "تحتاج إلى محتوى وحملات متّسقة على المدى الطويل.",
      ),
    },
  ],
  narrative: {
    headline: both(
      "Every meaningful transformation begins with a strong foundation.",
      "كل تحوّل حقيقي يبدأ بأساس متين.",
    ),
    paragraphs: [
      both(
        "Inspired by the Latin word radix, meaning root, RADIX represents the foundations from which ideas become brands, digital experiences, and intelligent solutions.",
        "استلهامًا من الكلمة اللاتينية radix التي تعني الجذر، تمثّل RADIX الأسس التي تتحوّل منها الأفكار إلى علامات تجارية وتجارب رقمية وحلول ذكية.",
      ),
      both(
        "We bring strategy, creativity, and technology together to build those foundations for businesses. Each discipline informs the others, so a brand decision shapes the website, and the website shapes the systems behind it.",
        "نجمع بين الاستراتيجية والإبداع والتقنية لنبني هذه الأسس للشركات. كل تخصص يُغني الآخر، فقرار الهوية يشكّل الموقع، والموقع يشكّل الأنظمة التي تقف خلفه.",
      ),
      both(
        "From establishing a distinctive identity to developing a digital presence or creating intelligent systems, RADIX helps businesses move forward with clarity and purpose.",
        "من بناء هوية مميزة إلى تطوير حضور رقمي أو إنشاء أنظمة ذكية، تساعد RADIX الشركات على المضيّ قدمًا بوضوح وهدف.",
      ),
    ],
  },
  arNeedsReview: true,
};

const home = {
  hero: {
    label: brandCopy.descriptor,
    headline: brandCopy.tagline,
    body: brandCopy.heroBody,
    primaryCta: both("Start a conversation", "ابدأ محادثة"),
    secondaryCta: both("Explore services", "استكشف خدماتنا"),
  },
  pillars: {
    label: both("Service architecture", "بنية الخدمات"),
    heading: both("Four pillars. One foundation.", "أربع ركائز. أساس واحد."),
  },
  positioning: {
    label: brandCopy.descriptor,
    heading: both(
      "One partner connecting the disciplines a business usually has to coordinate on its own.",
      "شريك واحد يربط التخصصات التي تضطر الشركة عادةً إلى تنسيقها بنفسها.",
    ),
    disciplines: [
      both("Strategic consulting", "الاستشارات الاستراتيجية"),
      both("Creative direction", "التوجيه الإبداعي"),
      both("Brand identity", "الهوية التجارية"),
      both("Digital experience design", "تصميم التجارب الرقمية"),
      both("Technology & intelligent systems", "التقنية والأنظمة الذكية"),
      both("AI-assisted production", "الإنتاج بمساعدة الذكاء الاصطناعي"),
      both("Digital growth & communication", "النموّ الرقمي والتواصل"),
    ],
  },
  featuredWork: { label: both("Selected work", "أعمال مختارة"), heading: both("", "") },
  process: { label: both("How we work", "كيف نعمل"), heading: both("", "") },
  teamPreview: { label: both("Team", "الفريق"), heading: both("", "") },
  closingCta: { statement: brandCopy.statement, cta: both("Start a conversation", "ابدأ محادثة") },
  arNeedsReview: true,
};

const SEED_SETTINGS: Partial<Record<SettingsKey, unknown>> = {
  general: {},
  seo: {
    defaultTitle: both("RADIX — Integrated creative & digital solutions", "RADIX — حلول إبداعية ورقمية متكاملة"),
    defaultDescription: brandCopy.heroBody,
    arNeedsReview: true,
  },
  home,
  about,
  process: { steps: seedProcessSteps.map((title) => ({ title, description: both("", "") })), arNeedsReview: true },
  legal: {},
  contact: {},
  locale: {},
  footer: { text: brandCopy.statement, arNeedsReview: true },
  hero: {},
};

async function main() {
  const { db, close } = scriptDb();
  let createdCategories = 0;
  let createdSettings = 0;

  for (const [index, category] of seedCategories.entries()) {
    const existing = await db.query.categories.findFirst({ where: eq(categories.slug, category.slug) });
    if (existing) continue;
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(categories)
        .values({
          slug: category.slug,
          name: category.name,
          tagline: category.tagline,
          iconKey: category.icon,
          sortOrder: index,
          arNeedsReview: true,
        })
        .returning({ id: categories.id });
      await tx
        .insert(services)
        .values(category.services.map((name, i) => ({ categoryId: row.id, name, sortOrder: i, arNeedsReview: true })));
    });
    createdCategories += 1;
  }

  for (const [key, raw] of Object.entries(SEED_SETTINGS) as [SettingsKey, unknown][]) {
    const value = SETTINGS_SCHEMAS[key].parse(raw);
    const result = await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoNothing()
      .returning({ key: settings.key });
    createdSettings += result.length;
  }

  await close();
  console.log(`Seed complete: ${createdCategories} categories created, ${createdSettings} settings keys created.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
