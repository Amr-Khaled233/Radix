/**
 * Brand-identity case studies by Mahmoud Sayed Hwary (RADIX team), taken from
 * his portfolio with his consent (mahmoudhwaryportfolio.com). Only client work:
 * concept redesigns of other companies, the graduation project and the
 * competition entry are deliberately left out.
 *
 * Text is as written on the portfolio (no added results or links). Arabic is a
 * first draft, flagged "Needs review". Images come from ./capture.mjs.
 * Imported as drafts by `pnpm db:import:case-studies`.
 */
import { both, type CaseStudy } from "../types";

const overview = (name: string, nameAr: string) => (i: number) =>
  both(`${name} brand identity — case study, part ${i + 1}`, `هوية ${nameAr} — دراسة الحالة، الجزء ${i + 1}`);

export const MAHMOUD = {
  slug: "mahmoud-hwary",
  name: both("Mahmoud Sayed Hwary", "محمود سيد هواري"),
  role: both("Creative Designer", "مصمم إبداعي"),
  shortBio: both(
    "I create designs that don't just look good — they tell a story and leave a lasting impact.",
    "أصمّم أعمالًا لا تكتفي بأن تبدو جميلة، بل تحكي قصة وتترك أثرًا يدوم.",
  ),
  bio: [
    both(
      "Brand identity, logos and marks, packaging design, visual content and art direction — with more than four years of experience.",
      "الهوية البصرية، والشعارات والعلامات، وتصميم العبوات، والمحتوى البصري، والإدارة الفنية — بخبرة تزيد على أربع سنوات.",
    ),
  ],
  photoAlt: both("Portrait of Mahmoud Sayed Hwary", "صورة محمود سيد هواري"),
  creditRole: both("Art direction & brand identity", "الإدارة الفنية والهوية البصرية"),
};

export const PORTFOLIO: CaseStudy[] = [
  {
    key: "genz",
    slug: "genz",
    title: both("GENZ — Crafted by People", "GENZ — صُنع بأيدي الناس"),
    client: both("GENZ", "GENZ"),
    year: 2025,
    summary: both(
      "GENZ is a youth-driven fashion label that turns everyday garments into a form of self-expression — fresh, sustainable and unapologetically modern.",
      "GENZ علامة أزياء شبابية تحوّل الملابس اليومية إلى وسيلة للتعبير عن الذات — منعشة، مستدامة، وعصرية بلا تردد.",
    ),
    body: [
      both(
        "A streetwear identity built on creativity, comfort and connection, designed for a generation that wears what it believes.",
        "هوية لملابس الشارع قائمة على الإبداع والراحة والتواصل، صُممت لجيل يرتدي ما يؤمن به.",
      ),
    ],
    applications: [
      both("Hang tags", "بطاقات التعليق"),
      both("Canvas tote", "حقيبة قماشية"),
      both("E-commerce", "المتجر الإلكتروني"),
      both("FW'25 campaign", "حملة خريف وشتاء 2025"),
      both("Signature tee", "التيشيرت المميز"),
      both("Knit socks", "جوارب محبوكة"),
      both("Lookbook", "كتالوج الإطلالات"),
      both("Mailer box", "صندوق الشحن"),
      both("Dad cap", "قبعة"),
    ],
    services: ["Visual identity", "Packaging", "Brand applications", "Art direction"],
    alt: (i) =>
      [
        both("GENZ brand identity — case study overview", "هوية GENZ — نظرة عامة على دراسة الحالة"),
        both("GENZ FW'25 campaign hoodie", "هودي حملة GENZ لخريف وشتاء 2025"),
        both("GENZ hang tags", "بطاقات تعليق GENZ"),
        both("GENZ canvas tote", "حقيبة GENZ القماشية"),
        both("GENZ e-commerce website", "متجر GENZ الإلكتروني"),
        both("GENZ signature tee", "تيشيرت GENZ المميز"),
        both("GENZ knit socks", "جوارب GENZ المحبوكة"),
        both("GENZ lookbook", "كتالوج إطلالات GENZ"),
        both("GENZ mailer box", "صندوق شحن GENZ"),
        both("GENZ dad cap", "قبعة GENZ"),
      ][i] ?? overview("GENZ", "GENZ")(i),
  },
  {
    key: "reve",
    slug: "21reve",
    title: both("21Rêve — Visual Identity System", "21Rêve — نظام الهوية البصرية"),
    client: both("21Rêve Studio", "21Rêve Studio"),
    year: 2024,
    summary: both(
      "21Rêve is a Cairo-born home & living house that fuses heritage Egyptian craft with a calm, contemporary hand.",
      "21Rêve دار للمنزل وأسلوب الحياة وُلدت في القاهرة، تمزج الحِرفة المصرية الأصيلة بلمسة معاصرة هادئة.",
    ),
    body: [
      both(
        "We built a complete visual identity around one confident wordmark, a generative line motif, and a strictly monochrome palette — carried across signage, stationery, packaging and textiles.",
        "بنينا هوية بصرية متكاملة حول شعار نصي واثق، وزخرفة خطية متولّدة، ولوحة ألوان أحادية صارمة — تمتد عبر اللافتات والقرطاسية والعبوات والمنسوجات.",
      ),
    ],
    applications: [
      both("Storefront signage", "لافتة الواجهة"),
      both("Dimensional wall logo", "شعار جداري مجسّم"),
      both("Business cards", "بطاقات العمل"),
      both("Hanging banner", "لافتة معلّقة"),
      both("Line-motif poster", "ملصق الزخرفة الخطية"),
      both("Stationery suite", "مجموعة القرطاسية"),
      both("Woven label and textile swatch", "ملصق منسوج وعينة قماش"),
    ],
    services: ["Brand identity systems", "Visual identity", "Packaging", "Brand applications"],
    alt: (i) =>
      i === 0
        ? both("21Rêve visual identity — case study overview", "هوية 21Rêve — نظرة عامة على دراسة الحالة")
        : both(`21Rêve identity in use — application ${i}`, `هوية 21Rêve قيد الاستخدام — تطبيق ${i}`),
  },
  {
    key: "bakebake",
    slug: "bake-bake",
    title: both("Bake Bake", "Bake Bake"),
    client: both("Bake Bake", "Bake Bake"),
    year: 2024,
    summary: both(
      "Founded in 1970 by a circle of passionate bakers set on reinventing the craft. From one small shop in a quaint neighbourhood, Bake Bake earned its name through inventive flavours and exquisite presentation.",
      "تأسست عام 1970 على يد مجموعة من الخبّازين الشغوفين بإعادة ابتكار الحِرفة. ومن متجر صغير في حيّ هادئ، صنعت Bake Bake اسمها بنكهات مبتكرة وتقديم راقٍ.",
    ),
    body: [
      both(
        "An artisan-bakery identity in Montserrat with a warm palette of falu red, sinopia, fawn and cream.",
        "هوية لمخبز حِرفي بخط Montserrat ولوحة ألوان دافئة من الأحمر القرميدي والبرتقالي الترابي والبيج والكريمي.",
      ),
    ],
    applications: [
      both("Wrapping pattern", "نقشة التغليف"),
      both("Box with pattern wrap", "علبة بنقشة التغليف"),
      both("Apron", "مريلة العمل"),
      both("Storefront signage", "لافتة الواجهة"),
    ],
    services: ["Visual identity", "Packaging", "Brand applications"],
    alt: overview("Bake Bake", "Bake Bake"),
  },
  {
    key: "levelup",
    slug: "level-up",
    title: both("Level Up", "Level Up"),
    client: both("Level Up", "Level Up"),
    year: 2025,
    summary: both(
      "Level Up is a media production company built around entertainment, creators, gaming culture, and digital experiences.",
      "Level Up شركة إنتاج إعلامي قائمة على الترفيه وصنّاع المحتوى وثقافة الألعاب والتجارب الرقمية.",
    ),
    body: [
      both(
        "The identity uses a pixel-inspired visual language with vivid purple and electric indigo to express energy, creativity, and modern production.",
        "تعتمد الهوية لغة بصرية مستوحاة من البكسل، بالأرجواني الزاهي والنيلي الكهربائي، للتعبير عن الطاقة والإبداع والإنتاج العصري.",
      ),
    ],
    applications: [
      both("Brand mark", "العلامة"),
      both("Sticker set", "مجموعة الملصقات"),
      both("Digital production", "الإنتاج الرقمي"),
      both("Out-of-home billboard", "لوحة إعلانية خارجية"),
      both("Stationery", "القرطاسية"),
    ],
    services: ["Visual identity", "Brand identity systems", "Brand applications"],
    alt: overview("Level Up", "Level Up"),
  },
  {
    key: "upperegypt",
    slug: "upper-egypt-food-industries",
    title: both("Upper Egypt For Food Industries", "Upper Egypt For Food Industries"),
    client: both("Upper Egypt For Food Industries", "Upper Egypt For Food Industries"),
    year: null,
    summary: both(
      "Identity for one of Egypt's most modern producers of frozen vegetables & fruits — a leaf-and-monogram mark built on growth, freshness and the land of the Nile valley.",
      "هوية لواحدة من أحدث شركات إنتاج الخضروات والفواكه المجمّدة في مصر — علامة تجمع الورقة والحرف الأول، مبنية على النمو والطزاجة وأرض وادي النيل.",
    ),
    body: [
      both(
        "Frozen fresh, straight from harvest: three core lines, flash-frozen within hours of picking to lock in color, bite and nutrition.",
        "مجمّدة طازجة من الحصاد مباشرة: ثلاثة خطوط أساسية تُجمَّد سريعًا خلال ساعات من القطف للحفاظ على اللون والقوام والقيمة الغذائية.",
      ),
    ],
    applications: [
      both("Logo and symbol", "الشعار والرمز"),
      both(
        "Product family: Mix with Corn, Okra, Peas & Carrots",
        "عائلة المنتجات: خضار مشكّل بالذرة، بامية، بازلاء وجزر",
      ),
    ],
    services: ["Visual identity", "Packaging"],
    alt: overview("Upper Egypt For Food Industries", "Upper Egypt For Food Industries"),
  },
  {
    key: "nas",
    slug: "nas-film-production",
    title: both("NAS Film Production", "NAS Film Production"),
    client: both("NAS Film Production", "NAS Film Production"),
    year: null,
    summary: both(
      "The largest visual content production network on social media — connecting the most creative directors with brands to craft cinematic content that travels all over the world.",
      "أكبر شبكة لإنتاج المحتوى البصري على وسائل التواصل الاجتماعي — تربط أكثر المخرجين إبداعًا بالعلامات التجارية لصناعة محتوى سينمائي يصل إلى العالم كله.",
    ),
    body: [
      both(
        "A social-first identity in Bricolage Grotesque, with purple, magenta and signal red on deep black: stories that travel.",
        "هوية مصممة أولًا لوسائل التواصل بخط Bricolage Grotesque، بالأرجواني والماجنتا والأحمر على أسود عميق: قصص تسافر.",
      ),
    ],
    applications: [],
    services: ["Visual identity", "Brand applications"],
    alt: overview("NAS Film Production", "NAS Film Production"),
  },
  {
    key: "gamestation",
    slug: "game-station",
    title: both("Game Station", "Game Station"),
    client: both("Game Station", "Game Station"),
    year: 2024,
    summary: both(
      "An 8-bit identity for a competitive gaming arena. Game Station fuses arcade nostalgia with a disciplined avocado-and-jet system — pixel-perfect, loud where it counts, quiet where it reads.",
      "هوية بأسلوب 8-bit لساحة ألعاب تنافسية. تمزج Game Station حنين ألعاب الأركيد بنظام منضبط من الأخضر الزيتوني والأسود — دقيق حتى البكسل، صاخب حيث يلزم، وهادئ حيث تُقرأ النصوص.",
    ),
    body: [
      both(
        "Game Station is a tournament-grade gaming hub. The brief was simple and unforgiving: an identity that feels like an 8-bit boot screen, yet holds its nerve across a live web product, print and motion.",
        "Game Station مركز ألعاب بمستوى البطولات. كان المطلوب بسيطًا وصارمًا: هوية تشبه شاشة تشغيل 8-bit، وتصمد في الوقت نفسه عبر منتج ويب حيّ والمطبوعات والحركة.",
      ),
      both("The answer is a strict pixel grid.", "وكان الحل شبكة بكسل صارمة."),
    ],
    applications: [
      both("Logo system", "نظام الشعار"),
      both("Colour", "الألوان"),
      both("Type", "الخطوط"),
      both("Web", "الويب"),
    ],
    services: ["Visual identity", "Brand identity systems", "Art direction"],
    alt: overview("Game Station", "Game Station"),
  },
  {
    key: "fawzi",
    slug: "fawzi-ronadi",
    title: both("Fawzi Ronadi", "فوزي رونادي"),
    client: both("Fawzi Ronadi", "فوزي رونادي"),
    year: null,
    summary: both(
      "A personal brand built on a seven-segment digital language. The mark fuses the initials F + R with the number 88 — a study in precision, rhythm, and the quiet glow of a digital readout.",
      "علامة شخصية مبنية على لغة الشاشات الرقمية ذات المقاطع السبعة. يجمع الشعار الحرفين F وR مع الرقم 88 — دراسة في الدقة والإيقاع والتوهّج الهادئ للشاشة الرقمية.",
    ),
    body: [
      both(
        "Two digits, one identity — the 88 reads the same in every light.",
        "رقمان وهوية واحدة — الـ 88 يُقرأ بالطريقة نفسها في كل ضوء.",
      ),
    ],
    applications: [
      both("Poster", "ملصق"),
      both("Construction grid", "شبكة البناء"),
      both("Environmental signage", "لافتات المكان"),
    ],
    services: ["Visual identity", "Brand applications"],
    alt: overview("Fawzi Ronadi", "فوزي رونادي"),
  },
  {
    key: "paula",
    slug: "paula",
    title: both("Paula", "Paula"),
    client: both("Paula", "Paula"),
    year: 2025,
    summary: both(
      "An AI engine built for poultry producers — predicting bird weight, mortality, and price with precision, and turning raw production data into daily decisions that protect margin and reduce risk.",
      "محرّك ذكاء اصطناعي لمنتجي الدواجن — يتنبأ بوزن الطيور ونسب النفوق والأسعار بدقة، ويحوّل بيانات الإنتاج الخام إلى قرارات يومية تحمي الهامش وتقلّل المخاطر.",
    ),
    body: [
      both(
        "Purpose: to empower poultry producers with intelligent, automated decision systems that replace intuition with science-driven insight.",
        "الغاية: تمكين منتجي الدواجن بأنظمة قرار ذكية وآلية تستبدل الحدس برؤى مبنية على العلم.",
      ),
      both("Predict. Optimize. Grow.", "تنبّأ. حسِّن. انمُ."),
    ],
    applications: [
      both("Prediction dashboard", "لوحة التنبؤ"),
      both("Business card and letterhead", "بطاقة العمل والورق الرسمي"),
      both("Social posts", "منشورات التواصل"),
      both("Facility signage", "لافتات المنشأة"),
      both("Cycle performance report", "تقرير أداء الدورة"),
    ],
    services: ["Visual identity", "Brand identity systems", "Brand applications"],
    alt: overview("Paula", "Paula"),
  },
];
