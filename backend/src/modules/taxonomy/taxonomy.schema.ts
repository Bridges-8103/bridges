import { z } from "zod";

export const tagTypeSchema = z.enum(["INTEREST", "SKILL", "BOTH"]);

export const taxonomyTagSchema = z
  .object({
    id: z.number().describe("Unique tag ID"),
    slug: z.string().describe("URL-friendly tag slug"),
    name: z.string().describe("Tag display name"),
    type: tagTypeSchema.describe("Tag type: INTEREST, SKILL, or BOTH"),
    isCurated: z.boolean().describe("Whether this tag is featured/curated for quick selection"),
    mentorCount: z.number().describe("Total active mentors with this expertise in the database"),
    aliases: z.array(z.string()).describe("Alternative names or synonyms for matching"),
  })
  .meta({
    id: "TaxonomyTag",
    example: {
      id: 1,
      slug: "artificial-intelligence",
      name: "Artificial Intelligence",
      type: "BOTH",
      isCurated: true,
      mentorCount: 154,
      aliases: ["AI", "GenAI"],
    },
  });

export const taxonomyCategorySchema = z
  .object({
    id: z.number().describe("Unique category ID"),
    slug: z.string().describe("Category slug"),
    name: z.string().describe("Category display name"),
    icon: z.string().describe("Icon name (SF Symbol / phosphor / lucide)"),
    sortOrder: z.number().describe("Display order"),
    mentorCount: z.number().describe("Total active mentors in this category"),
    tags: z.array(taxonomyTagSchema).describe("List of tags under this category"),
  })
  .meta({
    id: "TaxonomyCategory",
    example: {
      id: 1,
      slug: "tech-engineering",
      name: "Technology & Engineering",
      icon: "laptopcomputer",
      sortOrder: 1,
      mentorCount: 921,
      tags: [],
    },
  });

export const taxonomyQuerySchema = z.object({
  type: tagTypeSchema.optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const taxonomyResponseSchema = z
  .object({
    status: z.number(),
    data: z.array(taxonomyCategorySchema),
    message: z.string(),
  })
  .meta({
    id: "TaxonomyResponse",
  });
