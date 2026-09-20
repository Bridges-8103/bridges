import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import { updateProfileSchema, profileParamsSchema } from "@/modules/profile/profile.schema";
import { ProfileService } from "@/modules/profile/profile.service";

/**
 * GET /api/profile/[id]
 * Fetch profile by ID
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
 * PATCH /api/profile/[id]
 * Update profile details
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
 * DELETE /api/profile/[id]
 * Delete profile
 */
export const DELETE = withAuth<{ id: string }>(
  async (_req: NextRequest, { params }) => {
    const rawParams = await params;
    const { id } = profileParamsSchema.parse(rawParams);

    await ProfileService.deleteProfile(id);

    return sendResponse(200, null, `Profile '${id}' deleted successfully (placeholder).`);
  }
);
