export type TagType = 'INTEREST' | 'SKILL' | 'BOTH';

export interface TaxonomyTag {
  id: number;
  slug: string;
  name: string;
  type: TagType;
  isCurated: boolean;
  mentorCount: number;
  aliases: string[];
}

export interface TaxonomyCategory {
  id: number;
  slug: string;
  name: string;
  icon: string;
  sortOrder: number;
  mentorCount: number;
  tags: TaxonomyTag[];
}

export interface TaxonomyQueryParams {
  type?: TagType;
  category?: string;
  search?: string;
}
