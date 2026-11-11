/**
 * Websites RADIX built and deployed, shown under Sites & Systems with a live
 * link. Text describes only what is visible on each live site (its own copy
 * and features); Arabic is a first draft, flagged "Needs review".
 * Images and the El Deeb screen recording come from ./capture.mjs.
 *
 * Left out for now: ATREES (catalogue still empty), the hotel PMS (blank page),
 * and the systems behind a login (cafe, Sakary, Cupa, barber, clinic) until
 * there are screenshots or recordings from inside them.
 */
import { both, type CaseStudy } from "../types";

const views = (name: string, nameAr: string, labels: [string, string][]) => (i: number) => {
  const [en, ar] = labels[i] ?? [`page ${i + 1}`, `صفحة ${i + 1}`];
  return both(`${name} — ${en}`, `${nameAr} — ${ar}`);
};

export const SITES: CaseStudy[] = [
  {
    key: "jexi",
    slug: "jexi-accessories",
    title: both("JEXI Accessories — Online Store", "JEXI Accessories — متجر إلكتروني"),
    client: both("JEXI Accessories", "JEXI Accessories"),
    year: 2026,
    summary: both(
      "An online store for everyday jewelry — necklaces, hand chains, charms, rings, earrings and bracelets in gold, silver and rose gold, with free shipping across Egypt.",
      "متجر إلكتروني للإكسسوارات اليومية — سلاسل، وهاند تشين، وتعليقات، وخواتم، وحلقان، وأساور بالذهبي والفضي والروز جولد، مع شحن مجاني لكل مصر.",
    ),
    body: [
      both(
        "We designed and built the store end to end: a dark, gold-accented catalogue that lets the pieces stand out, organised by category, with best-seller and new-arrival collections and clear sale and sold-out labels.",
        "صممنا المتجر وبنيناه بالكامل: كتالوج داكن بلمسات ذهبية يُبرز القطع، مقسّم حسب الفئة، مع مجموعات الأكثر مبيعًا والوصول الجديد، وعلامات واضحة للتخفيضات والقطع النافدة.",
      ),
      both(
        "Curated gift boxes show the saving of the bundle, and every visitor can shop from a phone as easily as from a desktop.",
        "صناديق الهدايا الجاهزة تُظهر قيمة التوفير في الباقة، والتسوّق من الموبايل سهل تمامًا مثل الكمبيوتر.",
      ),
    ],
    applications: [
      both("Catalogue by category and collection", "كتالوج حسب الفئة والمجموعة"),
      both("Product pages", "صفحات المنتجات"),
      both("Gift boxes with bundle savings", "صناديق هدايا بقيمة توفير"),
      both("Cart and cash on delivery", "سلة مشتريات والدفع عند الاستلام"),
      both("Order tracking", "تتبّع الطلبات"),
      both("Responsive design for phones", "تصميم متجاوب مع الموبايل"),
    ],
    services: ["Website design", "Website development"],
    externalUrl: "https://jexi-store.vercel.app",
    alt: views("JEXI Accessories", "JEXI Accessories", [
      ["home page, best sellers", "الرئيسية، الأكثر مبيعًا"],
      ["home page, gift box", "الرئيسية، صندوق الهدايا"],
      ["home page, new arrivals", "الرئيسية، الوصول الجديد"],
      ["shop all", "كل المنتجات"],
      ["product page", "صفحة منتج"],
      ["gift box page", "صفحة صندوق الهدايا"],
      ["home page on a phone", "الرئيسية على الموبايل"],
      ["product page on a phone", "صفحة منتج على الموبايل"],
    ]),
  },
  {
    key: "luwjje",
    slug: "luwjje",
    title: both("LUWJJE — Online Store", "LUWJJE — متجر إلكتروني"),
    client: both("LUWJJE", "LUWJJE"),
    year: 2026,
    summary: both(
      "A fashion e-commerce store on its own domain, with delivery across Egypt and cash on delivery.",
      "متجر أزياء إلكتروني على دومين خاص، مع توصيل لكل مصر والدفع عند الاستلام.",
    ),
    body: [
      both(
        "A bilingual (English and Arabic) storefront that opens on a full-screen editorial image, then best sellers with sale pricing and quick add to cart.",
        "واجهة متجر بلغتين (عربي وإنجليزي) تبدأ بصورة كبيرة بعرض الشاشة، ثم الأكثر مبيعًا بأسعار التخفيض والإضافة السريعة للسلة.",
      ),
      both(
        "Product pages with a photo gallery, order tracking for customers, and the shipping, returns, privacy and terms pages a real store needs.",
        "صفحات منتجات بمعرض صور، وتتبّع الطلبات للعملاء، وصفحات الشحن والاسترجاع والخصوصية والشروط اللي يحتاجها أي متجر حقيقي.",
      ),
    ],
    applications: [
      both("English and Arabic", "عربي وإنجليزي"),
      both("Quick add to cart", "إضافة سريعة للسلة"),
      both("Product photo gallery", "معرض صور المنتج"),
      both("Order tracking", "تتبّع الطلبات"),
      both("Shipping, returns, privacy and terms pages", "صفحات الشحن والاسترجاع والخصوصية والشروط"),
    ],
    services: ["Website design", "Website development"],
    externalUrl: "https://www.luwjje.com",
    alt: views("LUWJJE", "LUWJJE", [
      ["home page, best sellers", "الرئيسية، الأكثر مبيعًا"],
      ["all products", "كل المنتجات"],
      ["product page", "صفحة منتج"],
      ["home page on a phone", "الرئيسية على الموبايل"],
      ["product page on a phone", "صفحة منتج على الموبايل"],
    ]),
  },
  {
    key: "eldeeb",
    slug: "el-deeb-contracting",
    title: both(
      "El Deeb Contracting & Engineering Consultancy — Website",
      "الديب للمقاولات والاستشارات الهندسية — الموقع الإلكتروني",
    ),
    client: both("El Deeb Contracting & Engineering Consultancy", "الديب للمقاولات والاستشارات الهندسية"),
    year: 2026,
    summary: both(
      "Website for an integrated contracting and architecture firm: architectural and structural design, residential and commercial construction, finishing and project management.",
      "موقع لشركة مقاولات وهندسة معمارية متكاملة: تصميم معماري وإنشائي، تنفيذ مبانٍ سكنية وتجارية، تشطيبات وإدارة مشاريع.",
    ),
    body: [
      both(
        "A scroll-driven story: as the visitor scrolls, a building rises floor by floor — from the foundations to a lit tower at night — echoing the company's line, “We build your vision, floor by floor.”",
        "قصة تتحرك مع التمرير: كلما نزل الزائر في الصفحة، يرتفع مبنى طابقًا فوق طابق — من الأساسات حتى برج مضاء في الليل — ترجمةً لشعار الشركة «نبني رؤيتك طابقًا فوق طابق».",
      ),
      both(
        "Around it: the sectors they work in, their services, a projects gallery and direct contact by phone, email and WhatsApp — in Arabic and English.",
        "وحولها: القطاعات التي تعمل بها الشركة، وخدماتها، ومعرض لمشاريعها، وتواصل مباشر بالهاتف والبريد وواتساب — بالعربي والإنجليزي.",
      ),
    ],
    applications: [
      both("Scroll-driven building animation", "حركة بناء المبنى مع التمرير"),
      both("Arabic and English", "عربي وإنجليزي"),
      both("Sectors and services", "القطاعات والخدمات"),
      both("Projects gallery", "معرض المشاريع"),
      both("Contact and WhatsApp", "التواصل وواتساب"),
    ],
    services: ["Website design", "Website development"],
    externalUrl: "https://eldeeb-flax.vercel.app",
    alt: views("El Deeb website", "موقع الديب", [
      ["screen recording: the building rises as the page scrolls", "تسجيل شاشة: المبنى يرتفع مع التمرير"],
      ["architectural design", "التصميم المعماري"],
      ["projects we are proud of", "مشاريع نفخر بتوقيعنا عليها"],
      ["engineering strength that builds trust", "قوة هندسية تبني الثقة"],
      ["the finished tower at night", "البرج مكتملًا في الليل"],
      ["we build your vision, floor by floor", "نبني رؤيتك طابقًا فوق طابق"],
      ["sectors we work in", "القطاعات التي نعمل بها"],
      ["services", "الخدمات"],
      ["projects", "المشاريع"],
      ["contact", "التواصل"],
      ["home page on a phone", "الرئيسية على الموبايل"],
    ]),
  },
  {
    key: "sinemai",
    slug: "sinemai-ai",
    title: both("Sinemai AI — Production & Equipment Sheets", "Sinemai AI — جداول الإنتاج والمعدات"),
    client: both("Sinemai AI", "Sinemai AI"),
    year: 2026,
    summary: both(
      "Upload a screenplay or ad brief and get a scene breakdown, an equipment package, matched cinematographers and rental vendors, and a costed budget.",
      "ارفع سيناريو أو بريف إعلان، واحصل على تفريغ للمشاهد، وباقة معدات، ومصوّرين وشركات تأجير مناسبين، وميزانية محسوبة.",
    ),
    body: [
      both(
        "An AI platform for film and ad production. Specialist agents read every scene — lighting complexity, camera movement, day or night, special requirements — then recommend the camera, lens, lighting and grip package from a curated catalogue.",
        "منصة ذكاء اصطناعي لإنتاج الأفلام والإعلانات. وكلاء متخصصون يقرؤون كل مشهد — تعقيد الإضاءة، وحركة الكاميرا، والنهار أو الليل، والمتطلبات الخاصة — ثم يقترحون باقة الكاميرا والعدسات والإضاءة والمعدات من كتالوج مُنتقى.",
      ),
      both(
        "Rental houses are matched by real stock, and the budget is built from real and estimated day rates. Scripts can be uploaded as Fountain, Final Draft, PDF or pasted scenes, in Arabic or English, with user accounts.",
        "تُرشَّح شركات التأجير حسب المخزون الفعلي، وتُبنى الميزانية من أسعار يومية حقيقية وتقديرية. يمكن رفع السيناريو بصيغة Fountain أو Final Draft أو PDF أو لصق المشاهد، بالعربي أو الإنجليزي، مع حسابات للمستخدمين.",
      ),
    ],
    applications: [
      both("Script upload and scene breakdown", "رفع السيناريو وتفريغ المشاهد"),
      both("AI agents for equipment recommendations", "وكلاء ذكاء اصطناعي لاقتراح المعدات"),
      both("Rental vendors matched by stock", "ترشيح شركات التأجير حسب المخزون"),
      both("Costed budget", "ميزانية محسوبة"),
      both("Arabic and English, user accounts", "عربي وإنجليزي، وحسابات للمستخدمين"),
    ],
    services: ["SaaS solutions", "AI integration", "Website design", "Website development"],
    externalUrl: "https://sinemai-ai.vercel.app",
    alt: views("Sinemai AI", "Sinemai AI", [
      ["how it works", "طريقة العمل"],
      ["call to action", "ابدأ مشروعًا"],
      ["landing page on a phone", "الصفحة الرئيسية على الموبايل"],
    ]),
  },
];
