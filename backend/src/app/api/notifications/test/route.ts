import { NextRequest } from "next/server";
import { sendResponse } from "@/lib/sendResponse";
import { getAuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validate";
import { withErrorHandler } from "@/lib/apiHandler";
import { sendTestPushSchema } from "@/modules/notifications/notifications.schema";
import { NotificationService } from "@/modules/notifications/notifications.service";
import { ProfileService } from "@/modules/profile/profile.service";

/**
 * Send test push notification
 * @description Sends a test push notification to a specified token or user.
 * @body sendTestPushSchema
 * @response 200:common
 * @responseSet public
 * @openapi
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await parseJsonBody(req, sendTestPushSchema);
  let targetTokens: string[] = [];

  if (body.token) {
    targetTokens.push(body.token);
  } else if (body.userId) {
    const numId = typeof body.userId === "number" ? body.userId : parseInt(body.userId, 10);
    if (!isNaN(numId)) {
      const tokens = await NotificationService.getActiveUserTokens(numId);
      targetTokens = tokens.map((t) => t.token);
    }
  } else {
    // Check if user is authenticated via Bearer token
    const authUser = await getAuthUser(req);
    if (authUser) {
      const profile = await ProfileService.getProfileByUserIdOrEmail(authUser.id, authUser.email);
      if (profile) {
        const numId = parseInt(profile.id, 10);
        const tokens = await NotificationService.getActiveUserTokens(numId);
        targetTokens = tokens.map((t) => t.token);
      }
    }
  }

  if (targetTokens.length === 0) {
    return sendResponse(
      400,
      null,
      "No valid target token found. Please provide a 'token' parameter (ExponentPushToken[...]) or 'userId' with active registered tokens."
    );
  }

  const result = await NotificationService.sendPushNotifications({
    to: targetTokens,
    title: body.title,
    body: body.body,
    data: body.data,
    channelId: body.channelId,
  });

  return sendResponse(
    200,
    result,
    `Test push notification dispatched to ${result.total} token(s).`
  );
});
