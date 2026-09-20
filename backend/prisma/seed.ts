import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.report.deleteMany({});
  await prisma.user.deleteMany({});

  const student = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      role: 'STUDENT',
      isSuspended: false,
      verificationStatus: 'APPROVED',
    },
  });

  const reportedUser = await prisma.user.create({
    data: {
      name: 'Michael Scott',
      email: 'michael@example.com',
      role: 'STUDENT',
      isSuspended: false,
      verificationStatus: 'PENDING',
    },
  });

  await prisma.report.create({
    data: {
      reporterId: student.id,
      reportedUserId: reportedUser.id,
      reason: 'Inappropriate language in group chat.',
      status: 'OPEN',
    },
  });

  console.log('Database re-seeded with report data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });