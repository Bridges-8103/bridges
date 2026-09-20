import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import { createProfileSchema } from "@/modules/profile/profile.schema";
import { ProfileService } from "@/modules/profile/profile.service";

/**
 * GET /api/profile
 * Retrieve profile information for the authenticated user
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
 * POST /api/profile
 * Create a new user profile for the authenticated user
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
