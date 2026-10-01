import fs from 'fs';
import path from 'path';
import { ResearcherProfile } from './types.js';

/**
 * Reads the scraped mentors.json file and generates a ready-to-run Prisma seed script
 * or direct SQL insert script for the backend database.
 */
async function main() {
  const outputDir = path.resolve(process.cwd(), 'output');
  const jsonPath = path.join(outputDir, 'mentors.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    console.error('Please run the crawler first to generate mentors data: npm run crawl');
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const mentors: ResearcherProfile[] = JSON.parse(raw);

  console.log(`Found ${mentors.length} scraped mentors in ${jsonPath}`);

  // Filter mentors that have at least name and email (or fallback email)
  const validMentors = mentors.filter((m) => m.fullName && (m.email || m.slug));

  // Generate a standalone TypeScript seed file for backend/prisma
  const seedTsContent = `// Auto-generated mentor seed data from Adelaide University crawler
// Generated on: ${new Date().toISOString()}
// Total mentors: ${validMentors.length}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedMentorsData = ${JSON.stringify(
    validMentors.map((m) => ({
      name: m.fullName,
      email: m.email || `${m.slug}@adelaide.edu.au`,
      role: 'MENTOR' as const,
      verificationStatus: 'APPROVED' as const,
      bio: m.bio || null,
      avatarUrl: m.imageUrl || null,
      phoneNumber: m.phone || null,
      mentorDetail: {
        jobTitle: m.jobTitle || m.leadDescription || 'Researcher',
        company: m.organisation || 'Adelaide University',
        industry: m.department || 'Higher Education & Research',
        expertise: m.interests || [],
        preferredEnquiries: ['Research Collaboration', 'Postgraduate Mentoring', 'Industry Consulting'],
        linkedinUrl: m.linkedinUrl || null,
      },
    })),
    null,
    2
  )};

export async function seedMentors(prismaInstance: PrismaClient) {
  console.log('Seeding ' + seedMentorsData.length + ' mentors into database...');
  let created = 0;
  for (const m of seedMentorsData) {
    try {
      const user = await prismaInstance.user.upsert({
        where: { email: m.email },
        update: {
          name: m.name,
          bio: m.bio,
          avatarUrl: m.avatarUrl,
          phoneNumber: m.phoneNumber,
        },
        create: {
          name: m.name,
          email: m.email,
          role: m.role,
          verificationStatus: m.verificationStatus,
          bio: m.bio,
          avatarUrl: m.avatarUrl,
          phoneNumber: m.phoneNumber,
          mentorDetail: {
            create: m.mentorDetail,
          },
        },
      });
      created++;
    } catch (e) {
      console.warn('Could not seed mentor ' + m.email + ':', e);
    }
  }
  console.log('Successfully seeded ' + created + ' mentors!');
}

if (process.argv[1] && process.argv[1].endsWith('seedMentors.ts')) {
  seedMentors(prisma)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
`;

  const targetPath = path.join(outputDir, 'seedMentors.ts');
  fs.writeFileSync(targetPath, seedTsContent, 'utf-8');
  console.log(`✅ Generated Prisma seed file: ${targetPath}`);
  console.log(`You can copy this file to backend/prisma/seedMentors.ts or import it in backend/prisma/seed.ts.`);
}

main().catch(console.error);
