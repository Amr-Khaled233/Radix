/**
 * Websites RADIX built and deployed, shown under Sites & Systems with a live
 * link. Text describes only what is visible on each live site (its own copy
 * and features); Arabic is a first draft, flagged "Needs review".
 * Screenshots and the desktop/phone walkthrough videos come from ./capture.mjs.
 *
 * Left out for now: ATREES (catalogue still empty), the hotel PMS (blank page).
 * Systems behind a login (and Sinemai AI, shown from the inside) are folders in ../systems.
 */
import { both, type CaseStudy, type L } from "../types";

/** [alt en, alt ar, caption en, caption ar] per gallery file, in capture.json order. */
type Entry = [string, string, string, string];

/** Alt text (for screen readers) and the visible caption (what the file shows) per gallery file. */
const gallery = (name: string, nameAr: string, entries: Entry[]) => ({
  alt: (i: number): L => {
    const [en, ar] = entries[i] ?? [`page ${i + 1}`, `صفحة ${i + 1}`];
    return both(`${name} — ${en}`, `${nameAr} — ${ar}`);
  },
  caption: (i: number): L | undefined => {
    const entry = entries[i];
    return entry && entry[2] ? both(entry[2], entry[3]) : undefined;
  },
});

const TOUR_DESKTOP = ["Walkthrough on desktop.", "جولة على الكمبيوتر."] as const;
const TOUR_PHONE = ["The same site on a phone.", "الموقع نفسه على الموبايل."] as const;

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
    ...gallery("JEXI Accessories", "JEXI Accessories", [
      [
        "walkthrough on desktop: home, shop, product and gift box",
        "جولة على الكمبيوتر: الرئيسية والمتجر والمنتج وصندوق الهدايا",
        ...TOUR_DESKTOP,
      ],
      [
        "home page, categories and best sellers",
        "الرئيسية، الفئات والأكثر مبيعًا",
        "Shop by category, with the best sellers up front.",
        "التسوّق حسب الفئة، والأكثر مبيعًا في الواجهة.",
      ],
      [
        "home page, gift box",
        "الرئيسية، صندوق الهدايا",
        "A ready-made gift box that shows the saving.",
        "صندوق هدايا جاهز يوضّح قيمة التوفير.",
      ],
      [
        "home page, new arrivals",
        "الرئيسية، الوصول الجديد",
        "New arrivals, with sale and sold-out labels.",
        "الوصول الجديد، مع علامات التخفيض والنفاد.",
      ],
      ["shop all", "كل المنتجات", "The full catalogue in one place.", "الكتالوج كله في مكان واحد."],
      [
        "product page",
        "صفحة منتج",
        "Product page: photos, price and options.",
        "صفحة المنتج: الصور والسعر والاختيارات.",
      ],
      [
        "gift box page",
        "صفحة صندوق الهدايا",
        "Gift box page, with the pieces inside.",
        "صفحة صندوق الهدايا والقطع اللي فيه.",
      ],
      ["walkthrough on a phone", "جولة على الموبايل", ...TOUR_PHONE],
      ["home page on a phone", "الرئيسية على الموبايل", "Home page on a phone.", "الرئيسية على الموبايل."],
      ["product page on a phone", "صفحة منتج على الموبايل", "Product page on a phone.", "صفحة المنتج على الموبايل."],
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
    ...gallery("LUWJJE", "LUWJJE", [
      [
        "walkthrough on desktop: home, shop and product",
        "جولة على الكمبيوتر: الرئيسية والمتجر والمنتج",
        ...TOUR_DESKTOP,
      ],
      [
        "home page, best sellers",
        "الرئيسية، الأكثر مبيعًا",
        "Best sellers with sale prices and quick add.",
        "الأكثر مبيعًا بأسعار التخفيض والإضافة السريعة.",
      ],
      ["all products", "كل المنتجات", "The full product list.", "قائمة المنتجات كاملة."],
      [
        "product page",
        "صفحة منتج",
        "Product page: photo gallery, sizes and add to cart.",
        "صفحة المنتج: معرض الصور والمقاسات والإضافة للسلة.",
      ],
      ["walkthrough on a phone", "جولة على الموبايل", ...TOUR_PHONE],
      ["home page on a phone", "الرئيسية على الموبايل", "Home page on a phone.", "الرئيسية على الموبايل."],
      ["product page on a phone", "صفحة منتج على الموبايل", "Product page on a phone.", "صفحة المنتج على الموبايل."],
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
    ...gallery("El Deeb website", "موقع الديب", [
      [
        "walkthrough on desktop: the building rises as the page scrolls",
        "جولة على الكمبيوتر: المبنى يرتفع مع التمرير",
        "Scroll the page and the building rises, floor by floor.",
        "مع التمرير يرتفع المبنى طابقًا فوق طابق.",
      ],
      [
        "architectural design",
        "التصميم المعماري",
        "Each stage of the building introduces a service: architectural design first.",
        "كل مرحلة من المبنى تقدّم خدمة: البداية بالتصميم المعماري.",
      ],
      [
        "projects we are proud of",
        "مشاريع نفخر بتوقيعنا عليها",
        "The floors go up as the story moves to their projects.",
        "الطوابق ترتفع والقصة تنتقل إلى مشاريعهم.",
      ],
      [
        "engineering strength that builds trust",
        "قوة هندسية تبني الثقة",
        "The tower takes shape.",
        "البرج يكتمل شكله.",
      ],
      [
        "the finished tower at night",
        "البرج مكتملًا في الليل",
        "The finished tower, lit at night.",
        "البرج مكتملًا ومضاءً في الليل.",
      ],
      [
        "we build your vision, floor by floor",
        "نبني رؤيتك طابقًا فوق طابق",
        "Then the company itself: “We build your vision, floor by floor.”",
        "ثم الشركة نفسها: «نبني رؤيتك طابقًا فوق طابق».",
      ],
      [
        "sectors we work in",
        "القطاعات التي نعمل بها",
        "The sectors they work in, one by one.",
        "القطاعات اللي بيشتغلوا فيها، واحد ورا التاني.",
      ],
      ["services", "الخدمات", "Their services under one roof.", "خدماتهم تحت سقف واحد."],
      ["projects", "المشاريع", "A gallery of their projects.", "معرض لمشاريعهم."],
      ["contact", "التواصل", "Contact by phone, email and WhatsApp.", "التواصل بالهاتف والبريد وواتساب."],
      ["walkthrough on a phone", "جولة على الموبايل", ...TOUR_PHONE],
      ["home page on a phone", "الرئيسية على الموبايل", "Home page on a phone.", "الرئيسية على الموبايل."],
    ]),
  },
];
