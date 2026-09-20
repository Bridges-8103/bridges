import { NextRequest } from "next/server";
import { z } from "zod";
import { sendResponse } from "@/lib/sendResponse";
import { withErrorHandler } from "@/lib/apiHandler";
import { parseJsonBody } from "@/lib/validate";
import { signJwt } from "@/lib/jwt";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * POST /api/auth/login
 * Public authentication route that issues a signed JWT.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const credentials = await parseJsonBody(req, loginSchema);

  // TODO: Verify credentials.password against database hash (e.g. bcrypt/argon2)
  console.log(`[Auth Login] Login attempt for: ${credentials.email}`);

  // Mock authenticated user details for boilerplate demonstration
  const mockUser = {
    id: "usr_" + Math.random().toString(36).substring(2, 9),
    email: credentials.email,
    role: "USER",
  };

  // Sign standard HS256 JWT valid for 7 days
  const token = await signJwt({
    sub: mockUser.id,
    email: mockUser.email,
    role: mockUser.role,
  });

  return sendResponse(
    200,
    {
      token,
      tokenType: "Bearer",
      expiresIn: 60 * 60 * 24 * 7,
      user: mockUser,
    },
    "Login successful."
  );
});
