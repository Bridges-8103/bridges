import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { withAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import {
  registerPushTokenSchema,
  unregisterPushTokenSchema,
} from "@/modules/notifications/notifications.schema";
import { NotificationService } from "@/modules/notifications/notifications.service";
import { ProfileService } from "@/modules/profile/profile.service";

/**
 * Register device push token
 * @description Registers an Expo push token for the authenticated user's device.
 * @body registerPushTokenSchema
 * @response 200:common
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await parseJsonBody(req, registerPushTokenSchema);

  // Resolve numeric database user ID
  let dbUserId: number | null = null;
  const profile = await ProfileService.getProfileByUserIdOrEmail(user.id, user.email);
  if (profile) {
    dbUserId = parseInt(profile.id, 10);
  }

  const storedToken = await NotificationService.registerToken(dbUserId, body);

  return sendResponse(
    200,
    {
      id: storedToken.id,
      token: storedToken.token,
      platform: storedToken.platform,
      isActive: storedToken.isActive,
    },
    "Device push token registered successfully."
  );
});

/**
 * Unregister device push token
 * @description Unregisters an Expo push token on logout or permission revocation.
 * @body unregisterPushTokenSchema
 * @response 200:common
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const DELETE = withAuth(async (req: NextRequest) => {
  const body = await parseJsonBody(req, unregisterPushTokenSchema);
  const success = await NotificationService.unregisterToken(body.token);

  return sendResponse(
    200,
    { success },
    success
      ? "Device push token unregistered successfully."
      : "Device push token was not found or already inactive."
  );
});
