#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import { AdelaideCrawler } from './crawler.js';
import { CrawlerConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('adelaide-researchers-crawler')
  .description(
    'Crawl Adelaide University researcher profiles to generate seed mentor data, CSV, and profile images'
  )
  .version('1.0.0')
  .option(
    '-s, --start-page <number>',
    'Starting pagination page index (default is 0 for first page)',
    '0'
  )
  .option(
    '-e, --end-page <number>',
    'Ending pagination page index (up to 354)',
    '354'
  )
  .option(
    '-l, --limit <number>',
    'Maximum total profiles to crawl (e.g. 10 for quick testing)'
  )
  .option(
    '-c, --concurrency <number>',
    'Number of concurrent profile requests',
    '3'
  )
  .option(
    '-d, --delay <number>',
    'Polite delay in milliseconds between requests',
    '250'
  )
  .option(
    '-o, --output-dir <path>',
    'Directory to save CSV, JSON, and downloaded images',
    path.resolve(process.cwd(), 'output')
  )
  .option('--skip-images', 'Skip downloading profile images', false)
  .option(
    '-r, --resume',
    'Resume crawl from previous checkpoint without duplicate requests',
    false
  )
  .option('-v, --verbose', 'Print verbose debug logs', false);

program.parse(process.argv);

const options = program.opts();

const config: CrawlerConfig = {
  baseUrl: 'https://researchers.adelaide.edu.au',
  startPage: parseInt(options.startPage, 10),
  endPage: parseInt(options.endPage, 10),
  limit: options.limit ? parseInt(options.limit, 10) : undefined,
  concurrency: parseInt(options.concurrency, 10),
  delayMs: parseInt(options.delay, 10),
  outputDir: path.resolve(options.outputDir),
  skipImages: Boolean(options.skipImages),
  resume: Boolean(options.resume),
  verbose: Boolean(options.verbose),
};

const crawler = new AdelaideCrawler(config);
crawler
  .run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error during crawl:', err);
    process.exit(1);
  });
