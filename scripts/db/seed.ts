/**
 * Seeds brand content from docs/brand-content.md: the four categories with
 * their services, home/about/process copy and empty settings. English is
 * final copy; Arabic strings are drafts flagged "Needs review".
 *
 * Idempotent — existing categories (by slug) and settings keys are kept; seeded
 * text that was never edited is updated by the revisions in ./revisions.ts.
 * No projects, team members or testimonials are seeded (brand rule).
 */
import { eq, inArray } from "drizzle-orm";
import { brandCopy, seedCategories, seedProcessSteps, type LocalizedText as L } from "../../lib/content/brand";
import { categories, services, settings } from "../../lib/db/schema";
import { SETTINGS_SCHEMAS, type SettingsKey } from "../../lib/settings/schemas";
import { scriptDb } from "./client";
import { PILLAR_RENAME, REMOVED_SERVICES, reviseText, SERVICE_MOVES } from "./revisions";

const both = (en: string, ar: string): L => ({ en, ar });

const about = {
  intro: {
    statement: both(
      "RADIX is an integrated creative and digital solutions company that builds the foundations businesses grow from.",
      "RADIX شركة حلول إبداعية ورقمية متكاملة، تبني الأسس التي تنمو منها الأعمال.",
    ),
    body: both(
      "RADIX brings strategy, design, and technology together to help businesses build strong brands, meaningful digital experiences, and reliable websites and systems, working as one connected partner.",
      "تجمع RADIX بين الاستراتيجية والتصميم والتقنية لتساعد الشركات على بناء علامات تجارية قوية، وتجارب رقمية ذات معنى، ومواقع وأنظمة يُعتمد عليها، كشريك واحد متكامل.",
    ),
  },
  meaning: {
    label: both("radix · Latin · noun", "radix · لاتينية · اسم"),
    word: both("root.", "جذر."),
    body: both(
      "The name comes from the Latin word for root. We use it to describe where our work happens: at the foundations of a business, where ideas become brands, digital experiences, websites, and systems.",
      "الاسم مأخوذ من الكلمة اللاتينية التي تعني «الجذر»، ويصف المكان الذي يبدأ منه عملنا: أسس الأعمال، حيث تتحوّل الأفكار إلى علامات تجارية وتجارب رقمية ومواقع وأنظمة.",
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
        title: both("Potential for growth", "مساحة للنمو"),
        body: both("Work built to adapt and extend.", "عمل مصمَّم ليتكيّف ويتوسّع."),
      },
    ],
  },
  essence: {
    label: both("Brand essence", "جوهر العلامة"),
    headline: both("Foundational Growth.", "نموّ يبدأ من الأساس."),
    body: both(
      "The single idea behind every RADIX decision: lasting growth depends on what is built underneath it.",
      "فكرة واحدة تقف وراء كل قرار في RADIX: النموّ الذي يدوم يعتمد على ما يُبنى تحته.",
    ),
  },
  coreIdea: {
    headline: both("Growth starts beneath the surface.", "النموّ يبدأ تحت السطح."),
    pillars: [
      {
        title: both("Strategy", "الاستراتيجية"),
        body: both("Knowing what to build and why.", "أن نعرف ماذا نبني ولماذا."),
      },
      { title: both("Systems", "الأنظمة"), body: both("Structures that scale.", "هياكل تتّسع مع النمو.") },
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
    "أن نحوّل احتياجات الأعمال إلى حلول إبداعية ورقمية ذات معنى، عبر تفكير استراتيجي وتصميم هادف وتقنية ذكية.",
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
        "نوظّف التقنية والأساليب الجديدة حيث تضيف قيمة حقيقية.",
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
      "طفولية · كرتونية · بلا ملامح · مستقبلية بإفراط · فاخرة بإفراط · عدوانية · صاخبة · رخيصة · فوضوية بصريًا · رسمية بتكلّف · شركة ذكاء اصطناعي بلا هوية · وكالة قوالب جاهزة",
    ),
  },
  problem: {
    label: both("The problem we address", "المشكلة التي نعالجها"),
    headline: both(
      "Brand, website, automation, and content are often handled by separate suppliers. The pieces rarely fit together.",
      "عادةً ما تتوزّع الهوية والموقع والأتمتة والمحتوى على جهات منفصلة، فنادرًا ما تتكامل هذه الأجزاء.",
    ),
    body: both(
      "RADIX connects those disciplines from the start, so every output is built on the same foundation.",
      "تربط RADIX هذه التخصصات من البداية، فيُبنى كل ما نقدّمه على الأساس نفسه.",
    ),
  },
  audiences: [
    {
      title: both("Founders and leadership teams", "المؤسسون وفرق القيادة"),
      body: both(
        "Building or rebuilding a brand from its strategy up.",
        "يبنون علامتهم التجارية أو يعيدون بناءها من الاستراتيجية.",
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
        "تبحث عن حلول عملية في الذكاء الاصطناعي والأتمتة والأدوات الرقمية.",
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
        "Inspired by the Latin word radix, meaning root, RADIX represents the foundations from which ideas become brands, digital experiences, websites, and systems.",
        "استلهامًا من الكلمة اللاتينية radix التي تعني «الجذر»، تمثّل RADIX الأسس التي تتحوّل منها الأفكار إلى علامات تجارية وتجارب رقمية ومواقع وأنظمة.",
      ),
      both(
        "We bring strategy, creativity, and technology together to build those foundations for businesses. Each discipline informs the others, so a brand decision shapes the website, and the website shapes the systems behind it.",
        "نجمع بين الاستراتيجية والإبداع والتقنية لنبني هذه الأسس للشركات. كل تخصص يُغذّي الآخر: قرار الهوية يشكّل الموقع، والموقع يشكّل الأنظمة التي تقف خلفه.",
      ),
      both(
        "From establishing a distinctive identity to developing a digital presence and building the systems behind it, RADIX helps businesses move forward with clarity and purpose.",
        "من بناء هوية مميزة، إلى تطوير حضور رقمي، إلى بناء الأنظمة التي تقف خلفه، تساعد RADIX الشركات على المضيّ قدمًا بوضوح وهدف.",
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
      "شريك واحد يجمع التخصصات التي تضطر الشركة عادةً إلى تنسيقها بنفسها.",
    ),
    disciplines: [
      both("Strategic consulting", "الاستشارات الاستراتيجية"),
      both("Creative direction", "التوجيه الإبداعي"),
      both("Brand identity", "الهوية التجارية"),
      both("Digital experience design", "تصميم التجارب الرقمية"),
      both("Websites & digital systems", "المواقع والأنظمة الرقمية"),
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

  // Renamed pillar keeps its id (and linked projects) under the new slug.
  const oldPillar = await db.query.categories.findFirst({ where: eq(categories.slug, PILLAR_RENAME.fromSlug) });
  const newPillar = await db.query.categories.findFirst({ where: eq(categories.slug, PILLAR_RENAME.toSlug) });
  if (oldPillar && !newPillar) {
    const seeded = seedCategories.find((c) => c.slug === PILLAR_RENAME.toSlug)!;
    const same = (a: L, b: L) => a.en === b.en && a.ar === b.ar;
    await db
      .update(categories)
      .set({
        slug: PILLAR_RENAME.toSlug,
        ...(same(oldPillar.name, PILLAR_RENAME.oldName) ? { name: seeded.name } : {}),
        ...(same(oldPillar.tagline, PILLAR_RENAME.oldTagline) ? { tagline: seeded.tagline } : {}),
      })
      .where(eq(categories.id, oldPillar.id));
    console.log(`Renamed pillar ${PILLAR_RENAME.fromSlug} → ${PILLAR_RENAME.toSlug}.`);
  }

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

  const revised = await reviseExisting(db);

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
  console.log(
    `Seed complete: ${createdCategories} categories created, ${createdSettings} settings keys created, ${revised} existing rows revised.`,
  );
}

/** Applies ./revisions.ts to content seeded earlier: moves, removals and untouched text. */
async function reviseExisting(db: ReturnType<typeof scriptDb>["db"]) {
  let revised = 0;
  const rows = await db.select().from(categories);
  const idBySlug = new Map(rows.map((c) => [c.slug, c.id]));
  const reorder = new Set<string>();

  for (const move of SERVICE_MOVES) {
    const from = idBySlug.get(move.from);
    const to = idBySlug.get(move.to);
    if (!from || !to) continue;
    const inTarget = (await db.select().from(services).where(eq(services.categoryId, to))).some(
      (s) => s.name.en === move.en,
    );
    const source = (await db.select().from(services).where(eq(services.categoryId, from))).find(
      (s) => s.name.en === move.en,
    );
    if (!source || inTarget) continue;
    await db.update(services).set({ categoryId: to }).where(eq(services.id, source.id));
    reorder.add(move.from).add(move.to);
    revised += 1;
  }

  const allServices = await db.select().from(services);
  const removable = allServices.filter((s) => REMOVED_SERVICES.some((r) => r.en === s.name.en && r.ar === s.name.ar));
  if (removable.length) {
    await db.delete(services).where(
      inArray(
        services.id,
        removable.map((s) => s.id),
      ),
    );
    revised += removable.length;
  }

  // Seed order for categories whose services moved; anything an admin added stays after.
  for (const slug of reorder) {
    const id = idBySlug.get(slug)!;
    const order = seedCategories.find((c) => c.slug === slug)?.services.map((s) => s.en) ?? [];
    const list = (await db.select().from(services).where(eq(services.categoryId, id))).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const rank = (en: string) => (order.includes(en) ? order.indexOf(en) : order.length);
    const sorted = [...list].sort((a, b) => rank(a.name.en) - rank(b.name.en));
    for (const [i, s] of sorted.entries()) {
      if (s.sortOrder !== i) await db.update(services).set({ sortOrder: i }).where(eq(services.id, s.id));
    }
  }

  for (const c of await db.select().from(categories)) {
    const name = reviseText(c.name);
    const tagline = reviseText(c.tagline);
    if (name !== c.name || tagline !== c.tagline) {
      await db.update(categories).set({ name, tagline }).where(eq(categories.id, c.id));
      revised += 1;
    }
  }
  for (const s of await db.select().from(services)) {
    const name = reviseText(s.name);
    if (name !== s.name) {
      await db.update(services).set({ name }).where(eq(services.id, s.id));
      revised += 1;
    }
  }
  for (const row of await db.select().from(settings)) {
    const value = reviseText(row.value);
    if (value !== row.value) {
      await db.update(settings).set({ value }).where(eq(settings.key, row.key));
      revised += 1;
    }
  }
  return revised;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
