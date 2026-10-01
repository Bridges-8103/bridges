import { prisma } from "@/lib/prisma";
import { type TagType } from "@prisma/client";

export interface TaxonomyFilterOptions {
  type?: TagType;
  category?: string;
  search?: string;
}

const CATEGORY_DEFINITIONS = [
  {
    slug: "tech-engineering",
    name: "Technology & Engineering",
    icon: "laptopcomputer",
    sortOrder: 1,
  },
  {
    slug: "health-medicine",
    name: "Health & Medical Sciences",
    icon: "heart.fill",
    sortOrder: 2,
  },
  {
    slug: "science-environment",
    name: "Natural Sciences & Environment",
    icon: "leaf.fill",
    sortOrder: 3,
  },
  {
    slug: "business-law",
    name: "Business, Finance & Law",
    icon: "briefcase.fill",
    sortOrder: 4,
  },
  {
    slug: "education-society",
    name: "Education & Social Sciences",
    icon: "books.vertical.fill",
    sortOrder: 5,
  },
  {
    slug: "arts-design",
    name: "Creative Arts, Design & Humanities",
    icon: "paintpalette.fill",
    sortOrder: 6,
  },
];

const COLLEGE_MAP: Record<string, string> = {
  "College of Engineering and Information Technology": "tech-engineering",
  "College of Health": "health-medicine",
  "College of Science": "science-environment",
  "College of Business and Law": "business-law",
  "College of Education, Behavioural and Social Sciences": "education-society",
  "College of Creative Arts, Design and Humanities": "arts-design",
  "Future Industries Institute": "tech-engineering",
  "Faculty of Health and Medical Sciences": "health-medicine",
  "Faculty of Sciences, Engineering and Technology": "tech-engineering",
  "Faculty of Arts, Business, Law and Economics": "business-law",
};

// Known common aliases / abbreviations
const ALIAS_MAP: Record<string, string[]> = {
  "Artificial Intelligence": ["AI", "GenAI", "Artificial Intelligence & LLMs"],
  "Machine learning": ["ML", "Machine Learning", "Deep Learning"],
  "Computer Vision": ["CV", "Vision Processing"],
  "Natural Language Processing": ["NLP", "LLMs"],
  "Cloud Computing": ["Cloud", "AWS", "Azure"],
  "Biomedical Engineering": ["Bioengineering", "MedTech"],
  "Clinical Psychology": ["Psychology", "Counseling"],
  "Applied Economics": ["Economics", "Econometrics"],
  "Public Health": ["Global Health", "Health Policy"],
  "Cybersecurity": ["InfoSec", "Network Security"],
  "Software Engineering": ["SWE", "Coding", "Software Dev"],
};

// Foundational skills across disciplines to ensure students have practical skills to pick
const ESSENTIAL_SKILLS: Array<{
  name: string;
  categorySlug: string;
  type: TagType;
  aliases: string[];
}> = [
  // Tech & Engineering
  { name: "Python", categorySlug: "tech-engineering", type: "SKILL", aliases: ["Python3", "Py"] },
  { name: "React & React Native", categorySlug: "tech-engineering", type: "SKILL", aliases: ["React", "ReactJS"] },
  { name: "TypeScript", categorySlug: "tech-engineering", type: "SKILL", aliases: ["TS", "JavaScript"] },
  { name: "Data Analysis", categorySlug: "tech-engineering", type: "BOTH", aliases: ["Data Science", "Analytics"] },
  { name: "System Design", categorySlug: "tech-engineering", type: "SKILL", aliases: ["Architecture", "Distributed Systems"] },
  { name: "SQL & Databases", categorySlug: "tech-engineering", type: "SKILL", aliases: ["PostgreSQL", "MySQL"] },
  { name: "Cloud & DevOps", categorySlug: "tech-engineering", type: "SKILL", aliases: ["Docker", "Kubernetes", "AWS"] },
  { name: "Machine Learning", categorySlug: "tech-engineering", type: "BOTH", aliases: ["ML", "Deep Learning"] },

  // Business & Law
  { name: "Product Management", categorySlug: "business-law", type: "SKILL", aliases: ["PM", "Product Strategy"] },
  { name: "Financial Modeling", categorySlug: "business-law", type: "SKILL", aliases: ["Finance", "Valuation"] },
  { name: "Contract Negotiation", categorySlug: "business-law", type: "SKILL", aliases: ["Negotiation", "Legal Review"] },
  { name: "Business Strategy", categorySlug: "business-law", type: "BOTH", aliases: ["Consulting", "Strategy"] },

  // Creative Arts & Design
  { name: "UI/UX Design", categorySlug: "arts-design", type: "SKILL", aliases: ["Figma", "Product Design", "User Research"] },
  { name: "Graphic Design", categorySlug: "arts-design", type: "SKILL", aliases: ["Visual Design", "Illustrator"] },
  { name: "Content Strategy & Copywriting", categorySlug: "arts-design", type: "SKILL", aliases: ["Writing", "Copywriting"] },

  // Science & Health
  { name: "Laboratory Research", categorySlug: "science-environment", type: "SKILL", aliases: ["Lab Methods", "Assays"] },
  { name: "Statistical Modeling", categorySlug: "science-environment", type: "BOTH", aliases: ["R", "Biostatistics", "SPSS"] },
  { name: "Clinical Data Analysis", categorySlug: "health-medicine", type: "BOTH", aliases: ["Epidemiology", "Clinical Trials"] },

  // Education & General Professional
  { name: "Public Speaking", categorySlug: "education-society", type: "SKILL", aliases: ["Presentations", "Communication"] },
  { name: "Scientific Writing", categorySlug: "education-society", type: "SKILL", aliases: ["Research Papers", "Academic Writing"] },
  { name: "Project Management", categorySlug: "business-law", type: "SKILL", aliases: ["Agile", "Scrum"] },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class TaxonomyService {
  /**
   * Sync taxonomy categories and tags from mentorDetail in database.
   * Mentor details serve as the single source of truth.
   */
  static async syncFromMentors(): Promise<{
    categoriesCreated: number;
    tagsCreated: number;
    mentorsProcessed: number;
  }> {
    const mentors = await prisma.mentorDetail.findMany({
      select: {
        company: true,
        industry: true,
        expertise: true,
      },
    });

    // 1. Compute category counts and topic votes
    const categoryMentorCounts: Record<string, number> = {};
    const topicVotes: Record<string, Record<string, number>> = {};
    const topicMentorCounts: Record<string, number> = {};

    for (const def of CATEGORY_DEFINITIONS) {
      categoryMentorCounts[def.slug] = 0;
    }

    for (const m of mentors) {
      const college = m.company || "";
      const catSlug = COLLEGE_MAP[college] || "science-environment";
      categoryMentorCounts[catSlug] = (categoryMentorCounts[catSlug] || 0) + 1;

      for (const rawTopic of m.expertise) {
        const topic = rawTopic.trim();
        if (!topic) continue;

        topicMentorCounts[topic] = (topicMentorCounts[topic] || 0) + 1;
        if (!topicVotes[topic]) {
          topicVotes[topic] = {};
        }
        topicVotes[topic][catSlug] = (topicVotes[topic][catSlug] || 0) + 1;
      }
    }

    // 2. Upsert Categories
    const categoryRecordMap = new Map<string, number>();
    for (const def of CATEGORY_DEFINITIONS) {
      const count = categoryMentorCounts[def.slug] || 0;
      const cat = await prisma.category.upsert({
        where: { slug: def.slug },
        create: {
          slug: def.slug,
          name: def.name,
          icon: def.icon,
          sortOrder: def.sortOrder,
          mentorCount: count,
        },
        update: {
          name: def.name,
          icon: def.icon,
          sortOrder: def.sortOrder,
          mentorCount: count,
        },
      });
      categoryRecordMap.set(def.slug, cat.id);
    }

    // 3. Classify topics into their winning category
    const categoryTopics: Record<string, Array<{ name: string; count: number }>> = {};
    for (const def of CATEGORY_DEFINITIONS) {
      categoryTopics[def.slug] = [];
    }

    for (const [topic, votes] of Object.entries(topicVotes)) {
      const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
      const winningCat = sortedVotes[0]?.[0] || "tech-engineering";
      categoryTopics[winningCat].push({
        name: topic,
        count: topicMentorCounts[topic] || 1,
      });
    }

    // 4. Prepare tag records in memory with unique slugs
    const tagRecords: Array<{
      slug: string;
      name: string;
      type: TagType;
      isCurated: boolean;
      mentorCount: number;
      aliases: string[];
      categoryId: number;
    }> = [];
    const usedSlugs = new Set<string>();

    for (const [catSlug, topics] of Object.entries(categoryTopics)) {
      const catId = categoryRecordMap.get(catSlug);
      if (!catId) continue;

      // Sort topics by mentorCount desc to find the top 20 curated ones
      topics.sort((a, b) => b.count - a.count);

      for (let i = 0; i < topics.length; i++) {
        const { name, count } = topics[i];
        const isCurated = i < 20; // Top 20 most frequent topics in category
        let baseSlug = slugify(name);
        if (!baseSlug) baseSlug = `tag-${Math.random().toString(36).substring(2, 8)}`;

        let slug = baseSlug;
        if (usedSlugs.has(slug)) {
          slug = `${catSlug}-${baseSlug}`;
        }
        if (usedSlugs.has(slug)) {
          slug = `${slug}-${count}`;
        }
        usedSlugs.add(slug);

        const aliases = ALIAS_MAP[name] || [];
        const lowerName = name.toLowerCase();
        const isBoth =
          lowerName.includes("engineering") ||
          lowerName.includes("computing") ||
          lowerName.includes("design") ||
          lowerName.includes("management") ||
          lowerName.includes("analytics") ||
          lowerName.includes("statistics") ||
          lowerName.includes("programming") ||
          lowerName.includes("intelligence");

        const tagType: TagType = isBoth ? "BOTH" : "INTEREST";

        tagRecords.push({
          slug,
          name,
          type: tagType,
          isCurated,
          mentorCount: count,
          aliases,
          categoryId: catId,
        });
      }
    }

    // 5. Add foundational skills
    for (const skill of ESSENTIAL_SKILLS) {
      const catId = categoryRecordMap.get(skill.categorySlug);
      if (!catId) continue;

      let slug = slugify(skill.name);
      if (usedSlugs.has(slug)) {
        slug = `${skill.categorySlug}-${slug}`;
      }
      usedSlugs.add(slug);

      tagRecords.push({
        slug,
        name: skill.name,
        type: skill.type,
        isCurated: true,
        mentorCount: topicMentorCounts[skill.name] || 15,
        aliases: skill.aliases,
        categoryId: catId,
      });
    }

    // 6. Fast batch insert into database
    await prisma.taxonomyTag.deleteMany();
    const batchResult = await prisma.taxonomyTag.createMany({
      data: tagRecords,
      skipDuplicates: true,
    });

    return {
      categoriesCreated: CATEGORY_DEFINITIONS.length,
      tagsCreated: batchResult.count,
      mentorsProcessed: mentors.length,
    };
  }

  /**
   * Retrieve categories with their tags.
   */
  static async getCategories(filters?: TaxonomyFilterOptions) {
    const whereTag: Record<string, unknown> = {};

    if (filters?.type) {
      // If student asks for INTEREST, return INTEREST and BOTH
      // If student asks for SKILL, return SKILL and BOTH
      if (filters.type === "INTEREST") {
        whereTag.type = { in: ["INTEREST", "BOTH"] };
      } else if (filters.type === "SKILL") {
        whereTag.type = { in: ["SKILL", "BOTH"] };
      } else {
        whereTag.type = filters.type;
      }
    }

    if (filters?.search && filters.search.trim()) {
      const query = filters.search.trim();
      whereTag.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { aliases: { has: query } },
      ];
    }

    const whereCategory: Record<string, unknown> = {};
    if (filters?.category) {
      whereCategory.slug = filters.category;
    }

    const categories = await prisma.category.findMany({
      where: whereCategory,
      orderBy: { sortOrder: "asc" },
      include: {
        tags: {
          where: whereTag,
          orderBy: [
            { isCurated: "desc" },
            { mentorCount: "desc" },
            { name: "asc" },
          ],
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      sortOrder: c.sortOrder,
      mentorCount: c.mentorCount,
      tags: c.tags.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        type: t.type,
        isCurated: t.isCurated,
        mentorCount: t.mentorCount,
        aliases: t.aliases,
      })),
    }));
  }
}
