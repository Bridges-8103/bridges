import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { TaxonomyService } from "@/modules/taxonomy/taxonomy.service";
import { taxonomyQuerySchema } from "@/modules/taxonomy/taxonomy.schema";
import { type TagType } from "@prisma/client";

/**
 * Get categorized taxonomy (categories, interests, skills)
 * @description Retrieves all categories with tags derived directly from active mentors.
 * @response 200:taxonomyResponseSchema
 * @openapi
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rawParams = {
    type: searchParams.get("type") || undefined,
    category: searchParams.get("category") || undefined,
    search: searchParams.get("search") || undefined,
  };

  const parsed = taxonomyQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return sendResponse(400, null, "Invalid query parameters", parsed.error.format());
  }

  const { type, category, search } = parsed.data;

  const categories = await TaxonomyService.getCategories({
    type: type as TagType | undefined,
    category,
    search,
  });

  const response = sendResponse(200, categories, "Taxonomy retrieved successfully.");

  // Cache for 1 hour at edge, 24 hours stale while revalidate
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );

  return response;
}
