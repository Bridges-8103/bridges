export interface ResearcherProfile {
  slug: string;
  fullName: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  leadDescription?: string;
  department?: string;
  organisation?: string;
  company: string;
  email?: string;
  phone?: string;
  campus?: string;
  bio?: string;
  interests: string[];
  supervision?: string;
  profileUrl: string;
  imageUrl?: string;
  imageFilename?: string;
  imageDownloaded: boolean;
  isDefaultImage: boolean;
  linkedinUrl?: string;
  orcidUrl?: string;
  googleScholarUrl?: string;
  researcherIdUrl?: string;
  scopusUrl?: string;
  education?: string;
  appointments?: string;
  scrapedAt: string;
}

export interface ProfileListItem {
  slug: string;
  name: string;
  profileUrl: string;
  cardImageUrl?: string;
  cardTitle?: string;
  cardOrganisation?: string;
  cardSupervision?: string;
}

export interface ListPageResult {
  items: ProfileListItem[];
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface CrawlerConfig {
  baseUrl: string;
  startPage: number;
  endPage: number;
  limit?: number;
  concurrency: number;
  delayMs: number;
  outputDir: string;
  skipImages: boolean;
  resume: boolean;
  verbose: boolean;
}

export interface CheckpointData {
  lastUpdated: string;
  completedPages: number[];
  visitedSlugs: string[];
  totalSaved: number;
}
