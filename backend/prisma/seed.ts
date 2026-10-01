import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const student = await prisma.user.upsert({
    where: { email: 'alex@example.com' },
    update: {
      name: 'Alex Johnson',
      role: 'STUDENT',
      isSuspended: false,
      verificationStatus: 'APPROVED',
    },
    create: {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      role: 'STUDENT',
      isSuspended: false,
      verificationStatus: 'APPROVED',
    },
  });

  const reportedUser = await prisma.user.upsert({
    where: { email: 'michael@example.com' },
    update: {
      name: 'Michael Scott',
      role: 'STUDENT',
      isSuspended: false,
      verificationStatus: 'PENDING',
    },
    create: {
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