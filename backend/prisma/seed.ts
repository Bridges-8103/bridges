import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("Seeding database...");

  // Clean up existing records in reverse relation order
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const user1 = await prisma.user.create({
    data: {
      email: "alice@example.com",
      name: "Alice Johnson",
      posts: {
        create: [
          {
            title: "Getting Started with Prisma and Next.js",
            content: "Prisma provides end-to-end type safety for database access.",
            published: true,
          },
          {
            title: "Scaling Backend Microservices",
            content: "Modular architecture keeps domain logic isolated and testable.",
            published: false,
          },
        ],
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "bob@example.com",
      name: "Bob Smith",
      posts: {
        create: [
          {
            title: "PostgreSQL Connection Pooling",
            content: "Using adapter-pg ensures efficient serverless connection pooling.",
            published: true,
          },
        ],
      },
    },
  });

  console.log("Seeded users:", [user1.email, user2.email]);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
