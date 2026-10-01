import fs from 'fs';
import path from 'path';
import { ResearcherProfile } from '../types.js';

export const CSV_HEADERS = [
  'slug',
  'full_name',
  'title',
  'first_name',
  'last_name',
  'job_title',
  'lead_description',
  'department',
  'organisation',
  'company',
  'email',
  'phone',
  'campus',
  'bio',
  'interests',
  'supervision',
  'profile_url',
  'image_url',
  'image_filename',
  'is_default_image',
  'linkedin_url',
  'orcid_url',
  'google_scholar_url',
  'researcher_id_url',
  'scopus_url',
  'education',
  'appointments',
  'scraped_at',
];

/**
 * Escapes a field for RFC-4180 CSV compliance.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str: string;
  if (Array.isArray(val)) {
    str = val.join('; ');
  } else if (typeof val === 'boolean') {
    str = val ? 'true' : 'false';
  } else {
    str = String(val);
  }

  // If contains double quotes, commas, or newlines, quote and escape quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts a profile to a CSV row string.
 */
export function profileToCsvRow(p: ResearcherProfile): string {
  const fields = [
    p.slug,
    p.fullName,
    p.title || '',
    p.firstName || '',
    p.lastName || '',
    p.jobTitle || '',
    p.leadDescription || '',
    p.department || '',
    p.organisation || '',
    p.company || 'Adelaide University',
    p.email || '',
    p.phone || '',
    p.campus || '',
    p.bio || '',
    p.interests,
    p.supervision || '',
    p.profileUrl,
    p.imageUrl || '',
    p.imageFilename || '',
    p.isDefaultImage,
    p.linkedinUrl || '',
    p.orcidUrl || '',
    p.googleScholarUrl || '',
    p.researcherIdUrl || '',
    p.scopusUrl || '',
    p.education || '',
    p.appointments || '',
    p.scrapedAt,
  ];

  return fields.map(escapeCsvField).join(',');
}

export class CsvStorage {
  private filePath: string;
  private isInitialized = false;

  constructor(outputDir: string, filename = 'mentors.csv') {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    this.filePath = path.join(outputDir, filename);
  }

  /**
   * Initializes CSV file with header if it doesn't already exist or if resume is false.
   */
  public init(resume: boolean): void {
    if (this.isInitialized) return;

    if (!resume || !fs.existsSync(this.filePath)) {
      const headerLine = CSV_HEADERS.map(escapeCsvField).join(',') + '\n';
      fs.writeFileSync(this.filePath, headerLine, 'utf-8');
    }
    this.isInitialized = true;
  }

  /**
   * Appends a batch of profiles to the CSV file.
   */
  public appendProfiles(profiles: ResearcherProfile[]): void {
    if (!this.isInitialized) {
      this.init(true);
    }
    if (profiles.length === 0) return;

    const rows = profiles.map((p) => profileToCsvRow(p)).join('\n') + '\n';
    fs.appendFileSync(this.filePath, rows, 'utf-8');
  }

  public getFilePath(): string {
    return this.filePath;
  }
}
