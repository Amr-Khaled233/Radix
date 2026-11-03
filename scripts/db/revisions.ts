/**
 * Content revisions applied by the seed to databases seeded with earlier copy.
 * Only text that still matches the old seed exactly is replaced, so anything an
 * admin edited in the dashboard is never touched.
 *
 * 2026-11 (owner request): the third pillar "Intelligence" became
 * "Sites & Systems" (websites moved from Digital, AI production moved to
 * Growth), and the Arabic was edited for natural phrasing.
 */

/** [old, new] pairs for whole localized strings, per language. */
export const TEXT_REVISIONS: { en: [string, string][]; ar: [string, string][] } = {
  en: [
    [
      "RADIX brings strategy, design, and technology together to help businesses build strong brands, meaningful digital experiences, and intelligent systems, working as one connected partner.",
      "RADIX brings strategy, design, and technology together to help businesses build strong brands, meaningful digital experiences, and reliable websites and systems, working as one connected partner.",
    ],
    [
      "The name comes from the Latin word for root. We use it to describe where our work happens: at the foundations of a business, where ideas become brands, digital experiences, and intelligent systems.",
      "The name comes from the Latin word for root. We use it to describe where our work happens: at the foundations of a business, where ideas become brands, digital experiences, websites, and systems.",
    ],
    [
      "Inspired by the Latin word radix, meaning root, RADIX represents the foundations from which ideas become brands, digital experiences, and intelligent solutions.",
      "Inspired by the Latin word radix, meaning root, RADIX represents the foundations from which ideas become brands, digital experiences, websites, and systems.",
    ],
    [
      "From establishing a distinctive identity to developing a digital presence or creating intelligent systems, RADIX helps businesses move forward with clarity and purpose.",
      "From establishing a distinctive identity to developing a digital presence and building the systems behind it, RADIX helps businesses move forward with clarity and purpose.",
    ],
    ["Technology & intelligent systems", "Websites & digital systems"],
  ],
  ar: [
    // Brand lines
    ["جذورنا استراتيجية، وبناؤنا للنمو.", "متجذّرون في الاستراتيجية، نبني من أجل النمو."],
    [
      "نربط الاستراتيجية والإبداع والتقنية لنبني الأسس التي يقوم عليها نموّ حقيقي للأعمال.",
      "نجمع الاستراتيجية والإبداع والتقنية لنبني الأسس التي يقوم عليها نموّ حقيقي للأعمال.",
    ],
    // About
    [
      "تجمع RADIX بين الاستراتيجية والتصميم والتقنية لتساعد الشركات على بناء علامات تجارية قوية وتجارب رقمية ذات معنى وأنظمة ذكية، كشريك واحد مترابط.",
      "تجمع RADIX بين الاستراتيجية والتصميم والتقنية لتساعد الشركات على بناء علامات تجارية قوية، وتجارب رقمية ذات معنى، ومواقع وأنظمة يُعتمد عليها، كشريك واحد متكامل.",
    ],
    [
      "الاسم مأخوذ من الكلمة اللاتينية التي تعني الجذر. نستخدمه لنصف المكان الذي يحدث فيه عملنا: عند أسس الأعمال، حيث تتحوّل الأفكار إلى علامات تجارية وتجارب رقمية وأنظمة ذكية.",
      "الاسم مأخوذ من الكلمة اللاتينية التي تعني «الجذر»، ويصف المكان الذي يبدأ منه عملنا: أسس الأعمال، حيث تتحوّل الأفكار إلى علامات تجارية وتجارب رقمية ومواقع وأنظمة.",
    ],
    ["قابلية النمو", "مساحة للنمو"],
    ["عمل مبني ليتكيّف ويتوسّع.", "عمل مصمَّم ليتكيّف ويتوسّع."],
    [
      "الفكرة الواحدة وراء كل قرار في RADIX: النموّ الدائم يعتمد على ما يُبنى تحته.",
      "فكرة واحدة تقف وراء كل قرار في RADIX: النموّ الذي يدوم يعتمد على ما يُبنى تحته.",
    ],
    ["بنى قابلة للتوسّع.", "هياكل تتّسع مع النمو."],
    [
      "أن نحوّل احتياجات الأعمال إلى حلول إبداعية ورقمية ذات معنى، من خلال التفكير الاستراتيجي والتصميم الهادف والتقنية الذكية.",
      "أن نحوّل احتياجات الأعمال إلى حلول إبداعية ورقمية ذات معنى، عبر تفكير استراتيجي وتصميم هادف وتقنية ذكية.",
    ],
    ["نستخدم التقنية والأساليب الجديدة حيث تكون مفيدة.", "نوظّف التقنية والأساليب الجديدة حيث تضيف قيمة حقيقية."],
    [
      "طفولية · كرتونية · عامة · مستقبلية بإفراط · فاخرة بإفراط · عدوانية · صاخبة · رخيصة · فوضوية بصريًا · مؤسسية بتكلّف · شركة ذكاء اصطناعي عامة · وكالة قوالب جاهزة",
      "طفولية · كرتونية · بلا ملامح · مستقبلية بإفراط · فاخرة بإفراط · عدوانية · صاخبة · رخيصة · فوضوية بصريًا · رسمية بتكلّف · شركة ذكاء اصطناعي بلا هوية · وكالة قوالب جاهزة",
    ],
    [
      "غالبًا ما يتولّى الهوية والموقع والأتمتة والمحتوى مورّدون منفصلون، ونادرًا ما تتكامل هذه الأجزاء.",
      "عادةً ما تتوزّع الهوية والموقع والأتمتة والمحتوى على جهات منفصلة، فنادرًا ما تتكامل هذه الأجزاء.",
    ],
    [
      "تربط RADIX هذه التخصصات منذ البداية، فيُبنى كل ناتج على الأساس نفسه.",
      "تربط RADIX هذه التخصصات من البداية، فيُبنى كل ما نقدّمه على الأساس نفسه.",
    ],
    [
      "يبنون علامة تجارية أو يعيدون بناءها بدءًا من استراتيجيتها.",
      "يبنون علامتهم التجارية أو يعيدون بناءها من الاستراتيجية.",
    ],
    [
      "تبحث عن ذكاء اصطناعي وأتمتة وأدوات رقمية عملية.",
      "تبحث عن حلول عملية في الذكاء الاصطناعي والأتمتة والأدوات الرقمية.",
    ],
    [
      "استلهامًا من الكلمة اللاتينية radix التي تعني الجذر، تمثّل RADIX الأسس التي تتحوّل منها الأفكار إلى علامات تجارية وتجارب رقمية وحلول ذكية.",
      "استلهامًا من الكلمة اللاتينية radix التي تعني «الجذر»، تمثّل RADIX الأسس التي تتحوّل منها الأفكار إلى علامات تجارية وتجارب رقمية ومواقع وأنظمة.",
    ],
    [
      "نجمع بين الاستراتيجية والإبداع والتقنية لنبني هذه الأسس للشركات. كل تخصص يُغني الآخر، فقرار الهوية يشكّل الموقع، والموقع يشكّل الأنظمة التي تقف خلفه.",
      "نجمع بين الاستراتيجية والإبداع والتقنية لنبني هذه الأسس للشركات. كل تخصص يُغذّي الآخر: قرار الهوية يشكّل الموقع، والموقع يشكّل الأنظمة التي تقف خلفه.",
    ],
    [
      "من بناء هوية مميزة إلى تطوير حضور رقمي أو إنشاء أنظمة ذكية، تساعد RADIX الشركات على المضيّ قدمًا بوضوح وهدف.",
      "من بناء هوية مميزة، إلى تطوير حضور رقمي، إلى بناء الأنظمة التي تقف خلفه، تساعد RADIX الشركات على المضيّ قدمًا بوضوح وهدف.",
    ],
    // Home
    ["التقنية والأنظمة الذكية", "المواقع والأنظمة الرقمية"],
    [
      "شريك واحد يربط التخصصات التي تضطر الشركة عادةً إلى تنسيقها بنفسها.",
      "شريك واحد يجمع التخصصات التي تضطر الشركة عادةً إلى تنسيقها بنفسها.",
    ],
    // Categories and services
    ["الرقمي", "التجارب الرقمية"],
    ["نموّ له هدف.", "ننمو بهدف."],
    ["التسمية", "اختيار الاسم"],
    ["تصميم الشعارات للعملاء الجدد", "تصميم الشعار للعلامات الجديدة"],
    ["أنظمة الهوية التجارية", "أنظمة الهوية"],
    ["أدلة الهوية", "دليل استخدام الهوية"],
    ["التغليف", "تصميم العبوات"],
    ["أنظمة التواصل للعلامة التجارية", "أنظمة تواصل العلامة"],
    ["تصميم الواجهات وتجربة المستخدم (UI/UX)", "تصميم الواجهات وتجربة المستخدم"],
    ["واجهات SaaS", "واجهات منصات SaaS"],
    ["تجارب متجاوبة", "تجارب تعمل على كل الشاشات"],
    ["الأدوات والأنظمة الرقمية", "أدوات وأنظمة رقمية مخصّصة"],
    ["إدارة وسائل التواصل الاجتماعي", "إدارة حسابات التواصل الاجتماعي"],
    ["تطوير المحتوى", "صناعة المحتوى"],
    ["تواصل العلامة التجارية", "تواصل العلامة"],
  ],
};

/** The old third pillar and what it becomes (only applied while it still has the old seeded name). */
export const PILLAR_RENAME = {
  fromSlug: "intelligence",
  toSlug: "sites-and-systems",
  oldName: { en: "Intelligence", ar: "الذكاء" },
  oldTagline: { en: "Make Technology Work Smarter.", ar: "نجعل التقنية تعمل بذكاء أكبر." },
};

/** Seeded services (by unchanged English name) that move between pillars. */
export const SERVICE_MOVES: { en: string; from: string; to: string }[] = [
  { en: "Website design", from: "digital", to: "sites-and-systems" },
  { en: "Website development", from: "digital", to: "sites-and-systems" },
  { en: "Landing pages", from: "digital", to: "sites-and-systems" },
  { en: "AI-powered video production", from: "sites-and-systems", to: "growth" },
  { en: "AI-assisted creative production", from: "sites-and-systems", to: "growth" },
];

/** Seeded services that no longer exist (removed only while unchanged). */
export const REMOVED_SERVICES = [{ en: "Intelligent digital systems", ar: "الأنظمة الرقمية الذكية" }];

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const maps = {
  en: new Map(TEXT_REVISIONS.en),
  ar: new Map(TEXT_REVISIONS.ar),
};

/** Replaces `{ en, ar }` values that still equal an old seeded string. Returns the same reference when nothing changed. */
export function reviseText<T>(value: T): T {
  const walk = (node: Json): Json => {
    if (Array.isArray(node)) {
      const next = node.map(walk);
      return next.some((v, i) => v !== node[i]) ? next : node;
    }
    if (node && typeof node === "object") {
      let changed = false;
      const out: Record<string, Json> = {};
      for (const [key, child] of Object.entries(node)) {
        let next = walk(child);
        if ((key === "en" || key === "ar") && typeof child === "string") {
          const replacement = maps[key].get(child);
          if (replacement !== undefined) next = replacement;
        }
        if (next !== child) changed = true;
        out[key] = next;
      }
      return changed ? out : node;
    }
    return node;
  };
  return walk(value as Json) as T;
}
