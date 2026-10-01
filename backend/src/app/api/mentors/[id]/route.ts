import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { MentorsService } from "@/modules/mentors/mentors.service";
import { mentorParamSchema } from "@/modules/mentors/mentors.schema";

/**
 * Fetch mentor public profile by ID
 * @description Retrieves complete profile details for a specific mentor by ID.
 * @path mentorParamSchema
 * @response 200:mentorDetailResponseSchema
 * @openapi
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rawParams = await params;
  const parsed = mentorParamSchema.safeParse(rawParams);

  if (!parsed.success) {
    return sendResponse(400, null, "Invalid mentor ID parameter", parsed.error.format());
  }

  const mentor = await MentorsService.getMentorById(parsed.data.id);

  if (!mentor) {
    return sendResponse(404, null, `Mentor with ID '${parsed.data.id}' not found.`);
  }

  const response = sendResponse(200, mentor, "Mentor profile retrieved successfully.");
  response.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");

  return response;
}
