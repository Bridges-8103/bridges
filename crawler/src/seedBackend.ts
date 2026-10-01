import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import { prisma } from './db.js';
import { ResearcherProfile } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .name('seed-backend')
  .description('Seed crawled mentor profiles into PostgreSQL database via Prisma')
  .option('-l, --limit <number>', 'Limit the number of mentors to seed')
  .option('-c, --concurrency <number>', 'Concurrent upsert workers', '15')
  .option('-d, --dry-run', 'Dry run without writing to the database', false)
  .option('--real-emails', 'Keep real university emails instead of safe masked emails', false)
  .parse(process.argv);

const options = program.opts();
const limit = options.limit ? parseInt(options.limit, 10) : undefined;
const concurrency = parseInt(options.concurrency, 10) || 15;
const isDryRun = Boolean(options.dryRun);
const useRealEmails = Boolean(options.realEmails);

function resolveAvatarUrl(m: ResearcherProfile): string | null {
  if (m.isDefaultImage) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=0284c7&color=fff&size=256`;
  }
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  if (r2PublicUrl && m.imageFilename) {
    return `${r2PublicUrl.replace(/\/+$/, '')}/avatars/mentors/${m.imageFilename}`;
  }
  return m.imageUrl || null;
}

async function main() {
  const jsonPath = path.resolve(__dirname, '../output/mentors.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ mentors.json not found at ${jsonPath}`);
    console.error('Run crawler first: npm run crawl');
    process.exit(1);
  }

  console.log(`📖 Reading mentors from ${jsonPath}...`);
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  let mentors: ResearcherProfile[] = JSON.parse(raw);

  console.log(`Found ${mentors.length} total crawled mentors.`);

  if (limit && limit > 0) {
    mentors = mentors.slice(0, limit);
    console.log(`⚠️ Limit specified: Processing first ${mentors.length} mentors.`);
  }

  if (isDryRun) {
    console.log('\n🔍 [DRY RUN MODE] Simulating transformation for sample mentors:');
    const sample = mentors.slice(0, 3).map((m) => {
      const safeEmail = useRealEmails
        ? m.email || `${m.slug}@adelaide.edu.au`
        : `${m.slug.toLowerCase()}@example.com`;
      return {
        name: m.fullName,
        email: safeEmail,
        contactEmail: m.email || null,
        avatarUrl: resolveAvatarUrl(m),
        jobTitle: m.jobTitle || m.leadDescription || 'Researcher',
        company: m.organisation || 'Adelaide University',
        industry: m.department || 'Higher Education & Research',
        expertiseCount: m.interests?.length || 0,
      };
    });
    console.log(JSON.stringify(sample, null, 2));
    console.log(`\n✅ Dry run successful for ${mentors.length} records. No changes made.`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\n🚀 Starting database seeding (${mentors.length} mentors, concurrency: ${concurrency})...`);
  const startTime = Date.now();
  let totalSeeded = 0;
  let totalErrors = 0;

  let index = 0;
  async function worker() {
    while (index < mentors.length) {
      const currentIndex = index++;
      const m = mentors[currentIndex];

      const safeEmail = useRealEmails
        ? m.email || `${m.slug}@adelaide.edu.au`
        : `${m.slug.toLowerCase()}@example.com`;

      const avatarUrl = resolveAvatarUrl(m);
      const contactEmail = m.email || null;
      const jobTitle = m.jobTitle || m.leadDescription || 'Researcher';
      const company = m.organisation || 'Adelaide University';
      const industry = m.department || 'Higher Education & Research';
      const expertise = m.interests || [];
      const preferredEnquiries = [
        'Research Collaboration',
        'Postgraduate Mentoring',
        'Industry Consulting',
      ];
      const linkedinUrl = m.linkedinUrl || null;

      try {
        await prisma.user.upsert({
          where: { email: safeEmail },
          create: {
            name: m.fullName,
            email: safeEmail,
            role: 'MENTOR',
            verificationStatus: 'APPROVED',
            bio: m.bio || null,
            avatarUrl,
            phoneNumber: m.phone || null,
            mentorDetail: {
              create: {
                jobTitle,
                company,
                industry,
                expertise,
                preferredEnquiries,
                linkedinUrl,
                contactEmail,
              },
            },
          },
          update: {
            name: m.fullName,
            bio: m.bio || null,
            avatarUrl,
            phoneNumber: m.phone || null,
            mentorDetail: {
              upsert: {
                create: {
                  jobTitle,
                  company,
                  industry,
                  expertise,
                  preferredEnquiries,
                  linkedinUrl,
                  contactEmail,
                },
                update: {
                  jobTitle,
                  company,
                  industry,
                  expertise,
                  preferredEnquiries,
                  linkedinUrl,
                  contactEmail,
                },
              },
            },
          },
        });

        totalSeeded++;
        if (totalSeeded % 100 === 0 || totalSeeded === mentors.length) {
          const progress = ((totalSeeded / mentors.length) * 100).toFixed(1);
          const elapsedSec = (Date.now() - startTime) / 1000;
          const rate = (totalSeeded / elapsedSec).toFixed(1);
          console.log(`[${totalSeeded}/${mentors.length}] (${progress}%) Seeded | ${rate} mentors/s`);
        }
      } catch (itemError) {
        totalErrors++;
        console.error(`❌ Failed to seed mentor ${m.slug}:`, itemError);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 Seeding completed in ${durationSec}s!`);
  console.log(`✅ Total seeded/updated: ${totalSeeded}`);
  if (totalErrors > 0) {
    console.log(`⚠️ Errors encountered: ${totalErrors}`);
  }
}

main()
  .catch((e) => {
    console.error('Fatal seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
