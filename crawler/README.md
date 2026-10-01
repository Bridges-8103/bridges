# Adelaide University Researchers Crawler (`crawler`)

A high-performance, resilient crawler submodule built to harvest researcher profiles from [Adelaide University Researcher Profiles](https://researchers.adelaide.edu.au) and transform them into structured seed data for mentors in the Bridges platform.

---

## 🎯 Features

- **Pagination Support**: Automatically crawls the directory from `page=0` through `page=354` (over 5,600 researcher profiles).
- **Comprehensive Profile Extraction**:
  - **Identity**: Full Name, Title/Honorific (`Prof`, `Dr`, etc.), First Name, Last Name.
  - **Academic Roles**: Job Title, Lead Description, Department/School, College/Organisation, Company.
  - **Mentorship & Bio**: Detailed biography text and research interests/keywords.
  - **Supervision**: Supervision eligibility (Masters/PhD principal supervisor status).
  - **Contacts**: Email address, Phone number, Campus location.
  - **External Profiles**: LinkedIn, ORCID, Google Scholar, ResearcherID, Scopus.
  - **Career History**: Education degrees and past/present appointments.
- **Dual Output Formats**:
  - **CSV**: Standard RFC-4180 compliant CSV (`output/mentors.csv`), ready for Excel, Pandas, or database bulk imports.
  - **JSON**: Structured JSON (`output/mentors.json`) for programmatic access.
- **Profile Image Downloader**: Downloads high-resolution researcher avatars directly into `output/images/<slug>.<ext>`, while detecting default placeholders.
- **Resilience & Politeness**:
  - Configurable rate limiting and concurrency to avoid server overload.
  - Automatic retry with exponential backoff on HTTP 429 (rate limits) or network hiccups.
  - Checkpoint tracking (`output/checkpoint.json`) allowing crawls to be stopped (Ctrl+C) and resumed without re-downloading or duplicating records.
- **Backend Prisma Seed Generator**: Includes a generator (`npm run seed:backend`) to transform scraped mentors into a ready-to-run Prisma seed script for `backend/prisma`.

---

## 📁 Submodule Structure

```
crawler/
├── package.json               # Package definition and npm scripts
├── tsconfig.json              # TypeScript configuration (NodeNext)
├── .gitignore                 # Excludes heavy binaries and caches
├── README.md                  # Submodule documentation
├── src/
│   ├── index.ts               # CLI entry point (Commander)
│   ├── crawler.ts             # Orchestrator, concurrency pool, rate limiter
│   ├── parser.ts              # HTML parsers for directory listing and profile pages (Cheerio)
│   ├── seedBackend.ts         # Bridges Prisma database seed file generator
│   ├── types.ts               # TypeScript data definitions
│   └── storage/
│       ├── csvWriter.ts       # RFC-4180 compliant CSV writer
│       ├── jsonWriter.ts      # Structured JSON writer
│       ├── imageDownloader.ts # Streamed image downloader with cache detection
│       └── checkpoint.ts      # Progress tracker for resuming crawls
└── output/                    # Generated seed files
    ├── mentors.csv            # The primary mentor CSV dataset
    ├── mentors.json           # Primary mentor JSON dataset
    ├── checkpoint.json        # Checkpoint state
    └── images/                # Downloaded profile images (<slug>.<ext>)
```

---

## 🚀 Quick Start

### 1. Installation

From the repository root or inside the `crawler` directory:

```bash
cd crawler
npm install
```

### 2. Run a Quick Test (5 Profiles)

To verify network access, parsing, CSV generation, and image downloading:

```bash
npm run crawl:test
```

### 3. Run a Single Page (Page 0)

Crawls all 16 profiles on the first page:

```bash
npm run crawl:page1
```

### 4. Run the Full Crawl (Pages 0 to 354)

```bash
npm run crawl:all
```

Or with custom parameters:

```bash
npm run crawl -- --start-page 0 --end-page 354 --concurrency 4 --delay 200
```

### 5. Resume an Interrupted Crawl

If a crawl was stopped or interrupted, resume seamlessly without repeating visited pages or re-downloading images:

```bash
npm run crawl:resume
```

---

## ⚙️ CLI Options & Flags

| Flag | Default | Description |
| :--- | :--- | :--- |
| `-s, --start-page <number>` | `0` | Starting pagination page index (`0` is Page 1) |
| `-e, --end-page <number>` | `354` | Ending pagination page index |
| `-l, --limit <number>` | `undefined` | Maximum total profiles to crawl (useful for tests) |
| `-c, --concurrency <number>` | `3` | Number of concurrent profile requests |
| `-d, --delay <number>` | `250` | Polite delay in milliseconds between requests |
| `-o, --output-dir <path>` | `./output` | Target folder for CSV, JSON, images, and checkpoints |
| `--skip-images` | `false` | Skip downloading image binaries (scrapes metadata only) |
| `-r, --resume` | `false` | Resume crawl from `checkpoint.json` without duplicates |
| `-v, --verbose` | `false` | Print detailed debug logs |

### Examples

```bash
# Crawl the first 50 mentors without downloading images:
npm run crawl -- --limit 50 --skip-images

# Crawl pages 10 to 20 with higher concurrency:
npm run crawl -- --start-page 10 --end-page 20 --concurrency 5 --delay 150

# Crawl into a custom output directory:
npm run crawl -- --limit 20 --output-dir ./custom_seeds
```

---

## 📊 CSV Column Specification

The output CSV (`output/mentors.csv`) includes the following columns:

| Column | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `slug` | String | Unique profile URL slug | `claudia.szabo` |
| `full_name` | String | Full name with title | `Prof Claudia Szabo` |
| `title` | String | Honorific | `Prof` |
| `first_name` | String | First name | `Claudia` |
| `last_name` | String | Last name | `Szabo` |
| `job_title` | String | Current position or role | `Dean, School of Computer Science...` |
| `lead_description` | String | Academic lead description | `Higher Degree by Research Candidate` |
| `department` | String | Academic school or department | `School of Computer Science and IT` |
| `organisation` | String | Faculty or College | `College of Engineering and IT` |
| `company` | String | University institution | `Adelaide University` |
| `email` | String | Primary contact email | `claudia.szabo@adelaide.edu.au` |
| `phone` | String | Office / contact phone | `+61 8 8313 ...` |
| `campus` | String | Campus location | `North Terrace` |
| `bio` | String | Full bio / research overview | `"My main research interests lie in..."` |
| `interests` | String | Semicolon-delimited interests | `Complex Systems; Distributed Computing` |
| `supervision` | String | Supervision eligibility | `Eligible to supervise Masters and PhD...` |
| `profile_url` | String | Direct profile URL | `https://researchers.adelaide.edu.au/profile/...` |
| `image_url` | String | Remote image URL | `https://researchers.adelaide.edu.au/sites/...` |
| `image_filename`| String | Local image file name | `claudia.szabo.png` |
| `is_default_image` | Boolean | True if profile uses placeholder | `false` |
| `linkedin_url` | String | LinkedIn profile link | `https://linkedin.com/...` |
| `orcid_url` | String | ORCID link | `https://orcid.org/...` |
| `google_scholar_url` | String | Google Scholar link | `https://scholar.google.com/...` |
| `researcher_id_url` | String | ResearcherID link | `https://researcherid.com/...` |
| `scopus_url` | String | Scopus link | `https://scopus.com/...` |
| `education` | String | Semicolon-delimited degrees | `PhD (2011, NUS); BSc (Bucharest)` |
| `appointments` | String | Semicolon-delimited positions | `Dean (2020 - ongoing); Assoc Prof...` |
| `scraped_at` | String | ISO 8601 timestamp | `2026-09-30T06:48:55.824Z` |

---

## 🗄️ Database Seeding (Bridges Backend)

The extracted data maps directly to the Prisma schema in `backend/prisma/schema.prisma`:

| Scraped Attribute | Prisma Model Field |
| :--- | :--- |
| `full_name` | `User.name` |
| `email` | `User.email` |
| `ROLE = MENTOR` | `User.role` |
| `bio` | `User.bio` |
| `image_url` / `image_filename` | `User.avatarUrl` |
| `phone` | `User.phoneNumber` |
| `job_title` | `MentorDetail.jobTitle` |
| `organisation` / `company` | `MentorDetail.company` |
| `department` | `MentorDetail.industry` |
| `interests` (Array) | `MentorDetail.expertise` (String[]) |
| `linkedin_url` | `MentorDetail.linkedinUrl` |

To generate a ready-to-run Prisma seed script:

```bash
npm run seed:backend
```

This generates `output/seedMentors.ts`, which can be imported into `backend/prisma/seed.ts` or executed directly with `ts-node` or `tsx`.
