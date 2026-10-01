import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });
dotenv.config();

program
  .name('upload-avatars')
  .description('Upload downloaded mentor avatar images to Cloudflare R2 bucket')
  .option('-l, --limit <number>', 'Limit the number of images to upload')
  .option('-c, --concurrency <number>', 'Concurrent uploads', '25')
  .option('-d, --dry-run', 'Simulate uploads without sending to R2', false)
  .option('--force', 'Re-upload even if already in checkpoint', false)
  .parse(process.argv);

const options = program.opts();
const limit = options.limit ? parseInt(options.limit, 10) : undefined;
const concurrency = parseInt(options.concurrency, 10) || 25;
const isDryRun = Boolean(options.dryRun);
const isForce = Boolean(options.force);

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

async function main() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    console.error('❌ Missing Cloudflare R2 credentials in environment.');
    process.exit(1);
  }

  const imagesDir = path.resolve(__dirname, '../output/images');
  const checkpointPath = path.resolve(__dirname, '../output/r2_avatar_checkpoint.json');

  if (!fs.existsSync(imagesDir)) {
    console.error(`❌ Images directory not found at ${imagesDir}`);
    process.exit(1);
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  let uploadedSet = new Set<string>();
  if (!isForce && fs.existsSync(checkpointPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'));
      if (Array.isArray(data)) {
        uploadedSet = new Set(data);
        console.log(`📋 Found ${uploadedSet.size} previously uploaded images in checkpoint.`);
      }
    } catch {
      // ignore
    }
  }

  const allFiles = fs.readdirSync(imagesDir).filter((f) => !f.startsWith('.'));
  let filesToUpload = isForce ? allFiles : allFiles.filter((f) => !uploadedSet.has(f));

  console.log(`📁 Found ${allFiles.length} total local images.`);
  console.log(`📤 ${filesToUpload.length} remaining images to upload.`);

  if (limit && limit > 0) {
    filesToUpload = filesToUpload.slice(0, limit);
    console.log(`⚠️ Limit specified: Processing ${filesToUpload.length} images.`);
  }

  if (filesToUpload.length === 0) {
    console.log('🎉 All avatar images are already uploaded to Cloudflare R2!');
    return;
  }

  if (isDryRun) {
    console.log('\n🔍 [DRY RUN] Would upload:');
    filesToUpload.slice(0, 5).forEach((f) => {
      console.log(`  ${f} -> avatars/mentors/${f} (${getMimeType(f)}) [${publicBaseUrl}/avatars/mentors/${f}]`);
    });
    console.log(`\nDry run completed for ${filesToUpload.length} images.`);
    return;
  }

  console.log(`\n🚀 Starting upload to Cloudflare R2 bucket "${bucket}" with concurrency ${concurrency}...`);
  const startTime = Date.now();
  let uploadedCount = 0;
  let failedCount = 0;

  // Worker queue for concurrency control
  let index = 0;
  async function worker() {
    while (index < filesToUpload.length) {
      const currentIndex = index++;
      const filename = filesToUpload[currentIndex];
      const filePath = path.join(imagesDir, filename);
      const key = `avatars/mentors/${filename}`;
      const contentType = getMimeType(filename);

      try {
        const fileBuffer = fs.readFileSync(filePath);
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );

        uploadedSet.add(filename);
        uploadedCount++;

        if (uploadedCount % 100 === 0 || uploadedCount === filesToUpload.length) {
          const progress = ((uploadedCount / filesToUpload.length) * 100).toFixed(1);
          const elapsedSec = (Date.now() - startTime) / 1000;
          const rate = (uploadedCount / elapsedSec).toFixed(1);
          console.log(
            `[${uploadedCount}/${filesToUpload.length}] (${progress}%) Uploaded | ${rate} img/s`
          );
          // Periodically save checkpoint
          fs.writeFileSync(checkpointPath, JSON.stringify(Array.from(uploadedSet)), 'utf-8');
        }
      } catch (err) {
        failedCount++;
        console.error(`❌ Failed to upload ${filename}:`, err);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  // Final checkpoint save
  fs.writeFileSync(checkpointPath, JSON.stringify(Array.from(uploadedSet)), 'utf-8');

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Upload completed in ${totalTimeSec}s!`);
  console.log(`✅ Successfully uploaded: ${uploadedCount}`);
  if (failedCount > 0) {
    console.log(`⚠️ Failed uploads: ${failedCount}`);
  }
}

main().catch(console.error);
