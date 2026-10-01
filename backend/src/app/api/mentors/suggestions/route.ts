import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { MentorsService } from "@/modules/mentors/mentors.service";
import { mentorSuggestionsQuerySchema } from "@/modules/mentors/mentors.schema";
import { getAuthUser } from "@/lib/auth";

/**
 * Get suggested mentors by student interests
 * @description Retrieves mentors scored and ranked by relevance to profile interests.
 * @response 200:mentorSuggestionsResponseSchema
 * @openapi
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rawParams = {
    interests: searchParams.get("interests") || undefined,
    limit: searchParams.get("limit") || undefined,
  };

  const parsed = mentorSuggestionsQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return sendResponse(400, null, "Invalid suggestions query parameters", parsed.error.format());
  }

  // Check if authenticated user ID is available
  const authUser = await getAuthUser(req);

  const suggestions = await MentorsService.getSuggestedMentors(
    parsed.data.interests,
    parsed.data.limit,
    authUser?.id
  );

  return sendResponse(200, suggestions, "Suggested mentors retrieved successfully.");
}
