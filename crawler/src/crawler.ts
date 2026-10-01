import {
  CrawlerConfig,
  ResearcherProfile,
  ProfileListItem,
} from './types.js';
import { parseListPage, parseProfilePage } from './parser.js';
import { CsvStorage } from './storage/csvWriter.js';
import { JsonStorage } from './storage/jsonWriter.js';
import { ImageDownloader } from './storage/imageDownloader.js';
import { CheckpointManager } from './storage/checkpoint.js';

export class AdelaideCrawler {
  private config: CrawlerConfig;
  private csvStorage: CsvStorage;
  private jsonStorage: JsonStorage;
  private imageDownloader: ImageDownloader;
  private checkpoint: CheckpointManager;
  private isStopping = false;
  private totalScraped = 0;

  constructor(config: CrawlerConfig) {
    this.config = config;
    this.csvStorage = new CsvStorage(config.outputDir);
    this.jsonStorage = new JsonStorage(config.outputDir);
    this.imageDownloader = new ImageDownloader(config.outputDir);
    this.checkpoint = new CheckpointManager(config.outputDir);

    // Setup graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n⚠️ Interrupted! Saving progress and exiting gracefully...');
      this.isStopping = true;
      this.checkpoint.save();
      this.jsonStorage.save();
      setTimeout(() => process.exit(0), 500);
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetch with retry and exponential backoff.
   */
  private async fetchWithRetry(url: string, retries = 3): Promise<string> {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });

        clearTimeout(timeoutId);

        if (res.status === 429) {
          const waitTime = attempt * 3000;
          console.warn(`[429 Rate Limit] Backing off for ${waitTime}ms on ${url}...`);
          await this.sleep(waitTime);
          continue;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return await res.text();
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (attempt === retries) {
          throw new Error(`Failed to fetch ${url} after ${retries} attempts: ${errMsg}`);
        }
        const backoff = attempt * 1000;
        await this.sleep(backoff);
      }
    }
    throw new Error(`Failed to fetch ${url}`);
  }

  /**
   * Process a single profile URL.
   */
  private async processProfile(
    item: ProfileListItem
  ): Promise<ResearcherProfile | null> {
    try {
      if (this.config.delayMs > 0) {
        await this.sleep(this.config.delayMs);
      }

      const html = await this.fetchWithRetry(item.profileUrl);
      const profile = parseProfilePage(
        html,
        item.profileUrl,
        this.config.baseUrl,
        item
      );

      // Download profile image if requested
      if (!this.config.skipImages && profile.imageUrl && profile.imageFilename) {
        const imgResult = await this.imageDownloader.download(
          profile.imageUrl,
          profile.imageFilename
        );
        profile.imageDownloaded = imgResult.success;
      }

      return profile;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Error crawling profile ${item.slug}: ${errMsg}`);
      return null;
    }
  }

  /**
   * Concurrently processes a list of profile items with bounded concurrency.
   */
  private async processBatchWithConcurrency(
    items: ProfileListItem[]
  ): Promise<ResearcherProfile[]> {
    const results: ResearcherProfile[] = [];
    const queue = [...items];
    const concurrency = Math.max(1, this.config.concurrency);

    const worker = async () => {
      while (queue.length > 0 && !this.isStopping) {
        if (this.config.limit && this.totalScraped >= this.config.limit) {
          break;
        }

        const item = queue.shift();
        if (!item) break;

        // Skip if already visited
        if (this.config.resume && this.checkpoint.isSlugVisited(item.slug)) {
          if (this.config.verbose) {
            console.log(`  ↪ Skipping already visited slug: ${item.slug}`);
          }
          continue;
        }

        const profile = await this.processProfile(item);
        if (profile) {
          results.push(profile);
          this.checkpoint.markSlugVisited(item.slug);
          this.totalScraped++;

          const imgStatus = this.config.skipImages
            ? 'skipped'
            : profile.imageDownloaded
            ? '✓ saved'
            : 'default/none';

          const interestsCount = profile.interests.length;
          const interestsPreview =
            interestsCount > 0 ? ` | ${interestsCount} interests` : '';

          console.log(
            `  ✓ [${this.totalScraped}] ${profile.fullName}${
              profile.jobTitle ? ` (${profile.jobTitle})` : ''
            }${interestsPreview} [Img: ${imgStatus}]`
          );
        }
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    return results;
  }

  /**
   * Run the crawler across the configured page range.
   */
  public async run(): Promise<{ totalScraped: number; csvPath: string }> {
    console.log('='.repeat(70));
    console.log('🚀 Adelaide University Researchers Seed Data Crawler');
    console.log('='.repeat(70));
    console.log(`Base URL:     ${this.config.baseUrl}`);
    console.log(`Page Range:   ${this.config.startPage} to ${this.config.endPage}`);
    console.log(`Limit:        ${this.config.limit ?? 'Unlimited'}`);
    console.log(`Concurrency:  ${this.config.concurrency}`);
    console.log(`Delay:        ${this.config.delayMs}ms`);
    console.log(`Images:       ${this.config.skipImages ? 'Disabled' : 'Enabled (saving to output/images/)'}`);
    console.log(`Output Dir:   ${this.config.outputDir}`);
    console.log(`Resume:       ${this.config.resume ? 'Yes (from checkpoint)' : 'No (fresh start)'}`);
    console.log('='.repeat(70) + '\n');

    this.csvStorage.init(this.config.resume);
    this.jsonStorage.init(this.config.resume);

    const startTime = Date.now();

    for (
      let page = this.config.startPage;
      page <= this.config.endPage;
      page++
    ) {
      if (this.isStopping) break;
      if (this.config.limit && this.totalScraped >= this.config.limit) {
        console.log(`\n🎯 Reached limit of ${this.config.limit} profiles. Stopping.`);
        break;
      }

      if (this.config.resume && this.checkpoint.isPageCompleted(page)) {
        if (this.config.verbose) {
          console.log(`[Page ${page}] Already completed in previous run. Skipping.`);
        }
        continue;
      }

      const pageUrl = `${this.config.baseUrl}/?page=${page}`;
      console.log(`\n📄 [Page ${page}/${this.config.endPage}] Fetching ${pageUrl}...`);

      let listHtml: string;
      try {
        listHtml = await this.fetchWithRetry(pageUrl);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`❌ Failed to fetch page ${page}: ${errMsg}`);
        continue;
      }

      const listResult = parseListPage(listHtml, this.config.baseUrl);
      console.log(`   Found ${listResult.items.length} researchers on page ${page}.`);

      if (listResult.items.length === 0) {
        console.log(`   No researchers found on page ${page}. End of directory.`);
        break;
      }

      // Filter unvisited if resuming
      const itemsToProcess = this.config.resume
        ? listResult.items.filter((item) => !this.checkpoint.isSlugVisited(item.slug))
        : listResult.items;

      if (itemsToProcess.length === 0) {
        console.log(`   All researchers on page ${page} already processed.`);
        this.checkpoint.markPageCompleted(page);
        continue;
      }

      // Process profiles
      const pageProfiles = await this.processBatchWithConcurrency(itemsToProcess);

      // Save to CSV & JSON
      if (pageProfiles.length > 0) {
        this.csvStorage.appendProfiles(pageProfiles);
        this.jsonStorage.appendProfiles(pageProfiles);
      }

      // Mark page as completed in checkpoint
      this.checkpoint.markPageCompleted(page, pageProfiles.length);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `💾 Page ${page} done. Saved ${pageProfiles.length} profiles. Total: ${this.totalScraped} (${elapsed}s elapsed)`
      );

      // Short delay between pages
      if (this.config.delayMs > 0 && !this.isStopping) {
        await this.sleep(this.config.delayMs);
      }
    }

    const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(70));
    console.log('✅ Crawling Complete!');
    console.log(`Total Profiles Crawled: ${this.totalScraped}`);
    console.log(`Total Time Taken:        ${totalSeconds}s`);
    console.log(`CSV Output:             ${this.csvStorage.getFilePath()}`);
    console.log(`JSON Output:            ${this.config.outputDir}/mentors.json`);
    console.log(`Images Directory:       ${this.imageDownloader.getImagesDir()}`);
    console.log('='.repeat(70) + '\n');

    return {
      totalScraped: this.totalScraped,
      csvPath: this.csvStorage.getFilePath(),
    };
  }
}
