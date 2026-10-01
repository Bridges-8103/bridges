import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import dotenv from 'dotenv';
import { createClerkClient } from '@clerk/backend';
import { ResearcherProfile } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });
dotenv.config();

program
  .name('sync-clerk-mentors')
  .description('Provision test mentor accounts in Clerk with simple password')
  .option('-l, --limit <number>', 'Number of test mentors to provision in Clerk', '50')
  .option('-p, --password <string>', 'Default simple password for test mentors', '12345678')
  .option('-d, --dry-run', 'Simulate creation without calling Clerk API', false)
  .parse(process.argv);

const options = program.opts();
const limit = parseInt(options.limit, 10) || 50;
const defaultPassword = options.password || '12345678';
const isDryRun = Boolean(options.dryRun);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY is not defined in environment variables.');
    process.exit(1);
  }

  const jsonPath = path.resolve(__dirname, '../output/mentors.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ mentors.json not found at ${jsonPath}`);
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const allMentors: ResearcherProfile[] = JSON.parse(raw);

  console.log(`Loaded ${allMentors.length} mentors from ${jsonPath}`);

  // Select top diverse mentors with rich profiles and real photos
  const departmentMap = new Map<string, ResearcherProfile[]>();
  for (const m of allMentors) {
    const dept = m.department || m.organisation || 'Other';
    if (!departmentMap.has(dept)) {
      departmentMap.set(dept, []);
    }
    departmentMap.get(dept)!.push(m);
  }

  const selectedMentors: ResearcherProfile[] = [];
  const selectedSlugs = new Set<string>();

  // Round-robin selection across departments to ensure diverse representation
  let added = true;
  while (selectedMentors.length < limit && added) {
    added = false;
    for (const [, mentorsInDept] of departmentMap) {
      if (selectedMentors.length >= limit) break;
      // Prefer ones with photos and bios
      const candidate = mentorsInDept.find(
        (m) =>
          !selectedSlugs.has(m.slug) &&
          !m.isDefaultImage &&
          m.bio &&
          m.bio.length > 50
      ) || mentorsInDept.find((m) => !selectedSlugs.has(m.slug));

      if (candidate) {
        selectedMentors.push(candidate);
        selectedSlugs.add(candidate.slug);
        added = true;
      }
    }
  }

  console.log(`🎯 Selected ${selectedMentors.length} diverse test mentors across ${departmentMap.size} fields.`);

  if (isDryRun) {
    console.log('\n🔍 [DRY RUN] Sample accounts to be provisioned in Clerk:');
    const sample = selectedMentors.slice(0, 5).map((m) => ({
      name: m.fullName,
      email: `${m.slug.toLowerCase()}@example.com`,
      username: `${m.slug.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_mentor`,
      password: defaultPassword,
      jobTitle: m.jobTitle || m.leadDescription,
      department: m.department,
    }));
    console.log(JSON.stringify(sample, null, 2));
    console.log(`\nDry run completed for ${selectedMentors.length} mentors. No accounts created in Clerk.`);
    return;
  }

  console.log(`\n🚀 Provisioning ${selectedMentors.length} mentors in Clerk (password: ${defaultPassword})...`);

  const credentialsList: Array<{
    name: string;
    email: string;
    username: string;
    password: string;
    jobTitle: string;
    department: string;
    clerkId: string;
  }> = [];

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < selectedMentors.length; i++) {
    const m = selectedMentors[i];
    const email = `${m.slug.toLowerCase()}@example.com`;
    const username = `${m.slug.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_mentor`.slice(0, 30);
    const firstName = m.firstName || m.fullName.split(' ')[0];
    const lastName = m.lastName || m.fullName.split(' ').slice(1).join(' ') || undefined;

    try {
      // Check if user already exists in Clerk
      const existing = await clerk.users.getUserList({
        emailAddress: [email],
      });

      if (existing.data && existing.data.length > 0) {
        const user = existing.data[0];
        credentialsList.push({
          name: m.fullName,
          email,
          username,
          password: defaultPassword,
          jobTitle: m.jobTitle || 'Mentor',
          department: m.department || 'Adelaide University',
          clerkId: user.id,
        });
        skippedCount++;
        console.log(`[${i + 1}/${selectedMentors.length}] ⏩ Exists in Clerk: ${email} (${user.id})`);
        continue;
      }

      // Create pre-verified user with super simple password
      const newUser = await clerk.users.createUser({
        username,
        emailAddress: [email],
        password: defaultPassword,
        firstName,
        lastName,
        skipPasswordChecks: true,
        publicMetadata: {
          role: 'MENTOR',
          slug: m.slug,
          jobTitle: m.jobTitle,
          department: m.department,
        },
      });

      createdCount++;
      credentialsList.push({
        name: m.fullName,
        email,
        username,
        password: defaultPassword,
        jobTitle: m.jobTitle || 'Mentor',
        department: m.department || 'Adelaide University',
        clerkId: newUser.id,
      });

      console.log(`[${i + 1}/${selectedMentors.length}] ✅ Created: ${email} (${username}) -> ${newUser.id}`);

      // Gentle pause to stay well under Clerk rate limits
      await sleep(150);
    } catch (err: any) {
      errorCount++;
      console.error(`[${i + 1}/${selectedMentors.length}] ❌ Error creating ${email}:`, err?.errors?.[0]?.message || err.message);
    }
  }

  // Save credentials output
  const credsPath = path.resolve(__dirname, '../output/test_mentors_credentials.json');
  fs.writeFileSync(credsPath, JSON.stringify(credentialsList, null, 2), 'utf-8');

  console.log(`\n🎉 Clerk provisioning complete!`);
  console.log(`✅ Newly created: ${createdCount}`);
  console.log(`⏩ Already existing: ${skippedCount}`);
  if (errorCount > 0) console.log(`⚠️ Errors: ${errorCount}`);
  console.log(`\n📄 Credentials saved to: ${credsPath}`);
  console.log(`You can now log in as any of these mentors with password: ${defaultPassword}`);
}

main().catch(console.error);
