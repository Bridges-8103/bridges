import { NextResponse } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { TaxonomyService } from "@/modules/taxonomy/taxonomy.service";

/**
 * Sync taxonomy categories and tags directly from mentor details
 * @description Extracts and classifies categories and expertise topics from mentors.
 * @response 200
 * @openapi
 */
export async function POST(): Promise<NextResponse> {
  try {
    const result = await TaxonomyService.syncFromMentors();
    return sendResponse(
      200,
      result,
      `Taxonomy synced successfully: ${result.tagsCreated} tags across ${result.categoriesCreated} categories from ${result.mentorsProcessed} mentors.`
    );
  } catch (error) {
    console.error("Failed to sync taxonomy from mentors:", error);
    return sendResponse(
      500,
      null,
      "Failed to sync taxonomy from mentors",
      error instanceof Error ? error.message : String(error)
    );
  }
}
