import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { ProfileService } from "@/modules/profile/profile.service";

/**
 * Search and list students
 * @description Retrieves a paginated list of students for peer networking and discovery.
 * @auth bearer
 * @response 200
 * @openapi
 */
export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const query = {
    search: searchParams.get("search") || searchParams.get("q") || undefined,
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
  };

  const result = await ProfileService.getStudents(query);
  return sendResponse(200, result, "Students retrieved successfully.");
});
