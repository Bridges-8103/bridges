import { z } from "zod";

export const authUserSchema = z
  .object({
    id: z.string().describe("User identifier"),
    email: z.string().email().describe("User email address"),
    role: z.string().describe("User role (e.g. USER, ADMIN)"),
  })
  .meta({ id: "AuthUser" });

export const authMeResponseDataSchema = z
  .object({
    user: authUserSchema,
  })
  .meta({ id: "AuthMeData" });

export const authMeResponseSchema = z
  .object({
    status: z.number(),
    data: authMeResponseDataSchema,
    message: z.string(),
  })
  .meta({
    id: "AuthMeResponse",
    example: {
      status: 200,
      data: {
        user: {
          id: "usr_abc123",
          email: "user@example.com",
          role: "USER",
        },
      },
      message: "Current user session retrieved successfully.",
    },
  });
