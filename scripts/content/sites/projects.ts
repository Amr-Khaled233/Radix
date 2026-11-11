/**
 * Websites RADIX built and deployed, shown under Sites & Systems with a live
 * link. Text describes only what is visible on each live site (its own copy
 * and features); Arabic is a first draft, flagged "Needs review".
 * The cover and the desktop/phone walkthrough videos come from ./capture.mjs.
 *
 * Left out for now: ATREES (catalogue still empty), the hotel PMS (blank page).
 * Systems behind a login are folders in ../systems.
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

/** The last paragraph on every site: what RADIX did. */
const DELIVERED = both(
  "We handled the whole build: the layout and visual system, the code, and making every page work as well on a phone as on a desktop. The two walkthroughs below are recorded from the live site.",
  "تولّينا العمل بالكامل: التخطيط والهوية البصرية للموقع، والبرمجة، وأن تعمل كل صفحة على الموبايل بنفس جودتها على الكمبيوتر. الجولتان بالأسفل مسجّلتان من الموقع الحقيقي.",
);

/** The last paragraph on the two stores: their videos show the dashboard, recorded locally on demo data. */
const DELIVERED_STORE = both(
  "We handled the whole build: the storefront, the dashboard behind it, the code, and making every page work as well on a phone as on a desktop. The two walkthroughs below open on the store, then go through every page of the dashboard; the dashboard is recorded on a demo copy of the store filled with sample orders and customers, so no real customer data is shown.",
  "تولّينا العمل بالكامل: واجهة المتجر، ولوحة التحكم التي تديره، والبرمجة، وأن تعمل كل صفحة على الموبايل بنفس جودتها على الكمبيوتر. الجولتان بالأسفل تبدآن بالمتجر، ثم تمرّان على كل صفحات لوحة التحكم، ولوحة التحكم مسجّلة على نسخة تجريبية من المتجر مليئة بطلبات وعملاء تجريبيين، فلا تظهر أي بيانات حقيقية للعملاء.",
);

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
        "Every product has its own page with photos, price and options, and curated gift boxes show the pieces inside and the saving of the bundle. The cart runs on cash on delivery, and customers can track their orders.",
        "لكل منتج صفحته بالصور والسعر والاختيارات، وصناديق الهدايا الجاهزة تعرض القطع التي بداخلها وقيمة التوفير في الباقة. السلة تعمل بالدفع عند الاستلام، ويستطيع العميل تتبّع طلبه.",
      ),
      both(
        "Behind the store is a dashboard the owner runs it from: an overview of orders, revenue, pending orders and low stock; the orders list with search and status filters, and each order's items, customer, address and status history, with an email to the customer when the status changes; products with colour variants and stock; gift boxes; categories and colours; the home page sections; promo codes; free-shipping offers; shipping zones per governorate; the store settings and the admin accounts.",
        "وخلف المتجر لوحة تحكم يديره صاحبه منها: نظرة عامة على الطلبات والإيرادات والطلبات المعلّقة والمخزون القليل؛ وقائمة الطلبات بالبحث والفلترة حسب الحالة، وتفاصيل كل طلب بمنتجاته وبيانات العميل والعنوان وسجل حالاته، مع إيميل للعميل عند تغيير الحالة؛ والمنتجات بألوانها ومخزونها؛ وصناديق الهدايا؛ والفئات والألوان؛ وأقسام الصفحة الرئيسية؛ وأكواد الخصم؛ وعروض الشحن المجاني؛ ومناطق الشحن لكل محافظة؛ وإعدادات المتجر وحسابات المشرفين.",
      ),
      DELIVERED_STORE,
    ],
    applications: [
      both("Catalogue by category and collection", "كتالوج حسب الفئة والمجموعة"),
      both("Product pages", "صفحات المنتجات"),
      both("Gift boxes with bundle savings", "صناديق هدايا بقيمة توفير"),
      both("Cart and cash on delivery", "سلة مشتريات والدفع عند الاستلام"),
      both("Order tracking", "تتبّع الطلبات"),
      both("Dashboard: orders, products, stock and revenue", "لوحة تحكم: الطلبات والمنتجات والمخزون والإيرادات"),
      both("Promo codes, free shipping and shipping zones", "أكواد خصم وشحن مجاني ومناطق شحن"),
      both("Responsive design for phones", "تصميم متجاوب مع الموبايل"),
    ],
    services: ["Website design", "Website development"],
    externalUrl: "https://jexi-store.vercel.app",
    ...gallery("JEXI Accessories", "JEXI Accessories", [
      [
        "walkthrough on desktop: the store, then every page of the dashboard",
        "جولة على الكمبيوتر: المتجر ثم كل صفحات لوحة التحكم",
        "The store and a product, then sign-in and every page of the dashboard: overview, orders and an order's details, home page, products, gift boxes, categories, promo codes, free shipping, shipping zones and settings.",
        "المتجر وصفحة منتج، ثم تسجيل الدخول وكل صفحات لوحة التحكم: النظرة العامة، والطلبات وتفاصيل طلب، والصفحة الرئيسية، والمنتجات، وصناديق الهدايا، والفئات، وأكواد الخصم، والشحن المجاني، ومناطق الشحن، والإعدادات.",
      ],
      [
        "walkthrough on a phone: the store and the dashboard",
        "جولة على الموبايل: المتجر ولوحة التحكم",
        "The same tour on a phone: the store, then the whole dashboard.",
        "نفس الجولة على الموبايل: المتجر، ثم لوحة التحكم كاملة.",
      ],
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
        "Product pages with a photo gallery and sizes, order tracking for customers, and the shipping, returns, privacy and terms pages a real store needs.",
        "صفحات منتجات بمعرض صور ومقاسات، وتتبّع الطلبات للعملاء، وصفحات الشحن والاسترجاع والخصوصية والشروط اللي يحتاجها أي متجر حقيقي.",
      ),
      both(
        "The store is run from a bilingual dashboard: orders with revenue and average order value, search and status filters, and the orders still waiting for the customer's email confirmation; products, categories and stock per colour and size; the home page offers and colour palette; shipping prices for all 27 governorates and free-shipping rules; the shop filters; promo codes; analytics with revenue by day, top products and the path from opening a product to placing an order, exportable to Excel; a shoppers report; and the store settings.",
        "ويُدار المتجر من لوحة تحكم بلغتين: الطلبات مع الإيرادات ومتوسط قيمة الطلب، والبحث والفلترة حسب الحالة، والطلبات التي تنتظر تأكيد العميل بالإيميل؛ والمنتجات والفئات والمخزون لكل لون ومقاس؛ وعروض الصفحة الرئيسية ولوحة الألوان؛ وأسعار الشحن لكل المحافظات الـ٢٧ وقواعد الشحن المجاني؛ وفلاتر المتجر؛ وأكواد الخصم؛ وتحليلات بالإيرادات اليومية والمنتجات الأكثر مبيعًا ومسار الزائر من فتح المنتج حتى إتمام الطلب، مع التصدير إلى Excel؛ وتقرير عن المتسوّقين؛ وإعدادات المتجر.",
      ),
      DELIVERED_STORE,
    ],
    applications: [
      both("English and Arabic", "عربي وإنجليزي"),
      both("Quick add to cart", "إضافة سريعة للسلة"),
      both("Product photo gallery", "معرض صور المنتج"),
      both("Order tracking", "تتبّع الطلبات"),
      both("Shipping, returns, privacy and terms pages", "صفحات الشحن والاسترجاع والخصوصية والشروط"),
      both("Dashboard: orders, products, stock and shipping", "لوحة تحكم: الطلبات والمنتجات والمخزون والشحن"),
      both("Analytics with Excel export", "تحليلات مع التصدير إلى Excel"),
    ],
    services: ["Website design", "Website development"],
    externalUrl: "https://www.luwjje.com",
    ...gallery("LUWJJE", "LUWJJE", [
      [
        "walkthrough on desktop: the store, then every page of the dashboard",
        "جولة على الكمبيوتر: المتجر ثم كل صفحات لوحة التحكم",
        "The store and a product, then sign-in and every page of the dashboard: orders, unconfirmed orders, products, categories, stock, offers, shipping, free shipping, shop filters, promo codes, analytics, shoppers and settings.",
        "المتجر وصفحة منتج، ثم تسجيل الدخول وكل صفحات لوحة التحكم: الطلبات، والطلبات غير المؤكدة، والمنتجات، والفئات، والمخزون، والعروض، والشحن، والشحن المجاني، وفلاتر المتجر، وأكواد الخصم، والتحليلات، والمتسوّقين، والإعدادات.",
      ],
      [
        "walkthrough on a phone: the store and the dashboard",
        "جولة على الموبايل: المتجر ولوحة التحكم",
        "The same tour on a phone: the store, then the whole dashboard.",
        "نفس الجولة على الموبايل: المتجر، ثم لوحة التحكم كاملة.",
      ],
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
        "Each stage of the building introduces part of the company — architectural design, the projects they are proud of, their engineering strength. Around it: the sectors they work in, their services, a projects gallery and direct contact by phone, email and WhatsApp — in Arabic and English.",
        "كل مرحلة من المبنى تقدّم جزءًا من الشركة — التصميم المعماري، والمشاريع التي تفخر بها، وقوتها الهندسية. وحولها: القطاعات التي تعمل بها الشركة، وخدماتها، ومعرض لمشاريعها، وتواصل مباشر بالهاتف والبريد وواتساب — بالعربي والإنجليزي.",
      ),
      DELIVERED,
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
        "Scroll the page and the building rises, floor by floor, to the finished tower at night.",
        "مع التمرير يرتفع المبنى طابقًا فوق طابق حتى البرج مكتملًا في الليل.",
      ],
      [
        "walkthrough on a phone: the whole page",
        "جولة على الموبايل: الصفحة كاملة",
        "The whole page on a phone, from the building to contact.",
        "الصفحة كاملة على الموبايل، من المبنى حتى التواصل.",
      ],
    ]),
  },
];
