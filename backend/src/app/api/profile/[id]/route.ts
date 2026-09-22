import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import { updateProfileSchema, profileParamsSchema } from "@/modules/profile/profile.schema";
import { ProfileService } from "@/modules/profile/profile.service";

/**
 * Fetch profile by ID
 * @description Retrieves a specific profile by its unique ID.
 * @path profileParamsSchema
 * @response 200:profileResponseSchema
 * @auth bearer
 * @responseSet item
 * @openapi
 */
export const GET = withAuth<{ id: string }>(
  async (_req: NextRequest, { params }) => {
    const rawParams = await params;
    const { id } = profileParamsSchema.parse(rawParams);

    const profile = await ProfileService.getProfileById(id);

    if (!profile) {
      return sendResponse(404, null, `Profile with ID '${id}' not found.`);
    }

    return sendResponse(200, profile, "Profile retrieved successfully.");
  }
);

/**
 * Update profile details
 * @description Updates details of an existing profile by ID.
 * @path profileParamsSchema
 * @body updateProfileSchema
 * @response 200:profileResponseSchema
 * @auth bearer
 * @responseSet item
 * @openapi
 */
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    const rawParams = await params;
    const { id } = profileParamsSchema.parse(rawParams);

    const body = await parseJsonBody(req, updateProfileSchema);
    const updatedProfile = await ProfileService.updateProfile(id, body);

    return sendResponse(
      200,
      updatedProfile,
      "Profile updated successfully (placeholder)."
    );
  }
);

/**
 * Delete profile
 * @description Permanently deletes a profile by ID.
 * @path profileParamsSchema
 * @response 200
 * @auth bearer
 * @responseSet item
 * @openapi
 */
export const DELETE = withAuth<{ id: string }>(
  async (_req: NextRequest, { params }) => {
    const rawParams = await params;
    const { id } = profileParamsSchema.parse(rawParams);

    await ProfileService.deleteProfile(id);

    return sendResponse(200, null, `Profile '${id}' deleted successfully (placeholder).`);
  }
);
