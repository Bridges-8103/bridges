import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { MentorsService } from "@/modules/mentors/mentors.service";
import { mentorQuerySchema } from "@/modules/mentors/mentors.schema";

/**
 * Search and list mentors
 * @description Retrieves a paginated list of mentors with optional filters for keyword search, taxonomy field, and skills.
 * @response 200:mentorListResponseSchema
 * @openapi
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rawParams = {
    search: searchParams.get("search") || searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    skills: searchParams.get("skills") || undefined,
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("limit") || undefined,
  };

  const parsed = mentorQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return sendResponse(400, null, "Invalid mentor query parameters", parsed.error.format());
  }

  const result = await MentorsService.getMentors(parsed.data);

  const response = sendResponse(200, result, "Mentors retrieved successfully.");

  // Cache for 60s at edge
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

  return response;
}
