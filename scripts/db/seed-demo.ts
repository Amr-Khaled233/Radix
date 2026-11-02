/**
 * Development only: adds obviously fake "Sample project" drafts so the
 * dashboard has something to show. Never run against production.
 */
import { eq, like } from "drizzle-orm";
import { categories, projectCategories, projects } from "../../lib/db/schema";
import { scriptDb } from "./client";

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    console.error("Refusing to seed demo content in production.");
    process.exit(1);
  }

  const { db, close } = scriptDb();
  const already = await db.query.projects.findFirst({ where: like(projects.slug, "sample-project-%") });
  if (already) {
    console.log("Demo projects already exist. Nothing changed.");
    await close();
    return;
  }

  const brand = await db.query.categories.findFirst({ where: eq(categories.slug, "brand") });
  for (const n of [1, 2, 3]) {
    const [row] = await db
      .insert(projects)
      .values({
        slug: `sample-project-${n}`,
        title: { en: `Sample project ${n} (demo)`, ar: `مشروع تجريبي ${n} (للعرض فقط)` },
        clientName: { en: "Demo client — not real", ar: "عميل تجريبي — غير حقيقي" },
        summary: { en: "Placeholder content for development only.", ar: "محتوى مؤقت لأغراض التطوير فقط." },
        status: "draft",
        sortOrder: n,
      })
      .returning({ id: projects.id });
    if (brand) await db.insert(projectCategories).values({ projectId: row.id, categoryId: brand.id, sortOrder: n });
  }

  await close();
  console.log("Added 3 demo draft projects.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
