import { TaxonomyService } from "../src/modules/taxonomy/taxonomy.service";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Starting taxonomy sync from mentor details...");
  const start = Date.now();
  const result = await TaxonomyService.syncFromMentors();
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`✅ Taxonomy sync finished in ${elapsed}s!`);
  console.log(`- Categories created/updated: ${result.categoriesCreated}`);
  console.log(`- Tags created/updated: ${result.tagsCreated}`);
  console.log(`- Mentors processed: ${result.mentorsProcessed}`);

  // Print summary of each category and top 5 tags
  const categories = await TaxonomyService.getCategories();
  console.log("\n📊 Categories Summary:");
  for (const cat of categories) {
    console.log(`\n📁 ${cat.name} (${cat.slug}) — ${cat.mentorCount} mentors, ${cat.tags.length} tags`);
    const top5 = cat.tags.slice(0, 5).map((t) => `${t.name} (${t.mentorCount})`).join(", ");
    console.log(`   Top tags: ${top5}`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Taxonomy sync failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
