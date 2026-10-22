import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Starting user avatar randomization for privacy protection...");
  const start = Date.now();

  const updateAll = process.argv.includes("--all");

  const beforeCount = await prisma.user.count({
    where: updateAll ? {} : { avatarUrl: { not: null } },
  });

  console.log(`🔍 Found ${beforeCount} user(s) matching criteria (updateAll=${updateAll}).`);

  // Sample 5 records before
  const sampleBefore = await prisma.user.findMany({
    where: { avatarUrl: { not: null } },
    select: { id: true, name: true, avatarUrl: true },
    take: 5,
  });

  console.log("\n📷 Sample records before update:");
  for (const u of sampleBefore) {
    console.log(`  [ID ${u.id}] ${u.name} -> ${u.avatarUrl}`);
  }

  // Perform bulk update using raw SQL for maximum performance
  let updatedRows = 0;
  if (updateAll) {
    updatedRows = await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "avatarUrl" = ('https://i.pravatar.cc/300?u=' || id)
    `);
  } else {
    updatedRows = await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "avatarUrl" = ('https://i.pravatar.cc/300?u=' || id)
      WHERE "avatarUrl" IS NOT NULL
    `);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\n✅ Successfully updated ${updatedRows} user avatar(s) in ${elapsed}s!`);

  // Sample 5 records after
  const sampleAfter = await prisma.user.findMany({
    where: { avatarUrl: { not: null } },
    select: { id: true, name: true, avatarUrl: true },
    take: 5,
  });

  console.log("\n✨ Sample records after update:");
  for (const u of sampleAfter) {
    console.log(`  [ID ${u.id}] ${u.name} -> ${u.avatarUrl}`);
  }

  // Verification count of remaining old domains
  const remainingOldUrls = await prisma.user.count({
    where: { avatarUrl: { contains: "assets.megatunger.com" } },
  });
  const pravatarUrls = await prisma.user.count({
    where: { avatarUrl: { contains: "i.pravatar.cc" } },
  });

  console.log("\n📊 Verification summary:");
  console.log(`  - Remaining assets.megatunger.com avatars: ${remainingOldUrls}`);
  console.log(`  - Pravatar avatars active: ${pravatarUrls}`);
}

main()
  .catch((err) => {
    console.error("❌ Avatar randomization failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
