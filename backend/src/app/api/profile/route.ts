import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import { createProfileSchema } from "@/modules/profile/profile.schema";
import { ProfileService } from "@/modules/profile/profile.service";

/**
 * Get current user profile
 * @description Retrieves profile information for the authenticated user.
 * @response 200:profileResponseSchema
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const profile = await ProfileService.getProfileByUserId(user.id);

  if (!profile) {
    return sendResponse(
      200,
      {
        userId: user.id,
        email: user.email,
        profile: null,
        message: "No profile found for authenticated user. Create one via POST /api/profile.",
      },
      "Authenticated user session ready"
    );
  }

  return sendResponse(200, profile, "Profile retrieved successfully.");
});

/**
 * Create user profile
 * @description Creates a new user profile for the authenticated user.
 * @body createProfileSchema
 * @response 201:profileResponseSchema
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await parseJsonBody(req, createProfileSchema);

  // Enforce the authenticated user's ID
  const profileData = {
    ...body,
    userId: user.id,
  };

  const newProfile = await ProfileService.createProfile(profileData);

  return sendResponse(
    201,
    newProfile,
    "Profile created successfully (placeholder)."
  );
});
