import { z } from "zod";

/**
 * Validation schema for creating a new user profile.
 */
export const createProfileSchema = z
  .object({
    userId: z.string().min(1, "User ID is required").describe("Associated user ID"),
    displayName: z.string().min(2, "Display name must be at least 2 characters").max(50).describe("Public display name"),
    bio: z.string().max(250).optional().describe("User biography"),
    avatarUrl: z.string().url("Avatar must be a valid URL").optional().describe("Avatar image URL"),
    phoneNumber: z.string().optional().describe("Contact phone number"),
  })
  .meta({
    id: "CreateProfileInput",
    example: {
      userId: "usr_abc123",
      displayName: "Jane Doe",
      bio: "Software developer and open source enthusiast.",
      avatarUrl: "https://example.com/avatars/janedoe.png",
      phoneNumber: "+1234567890",
    },
  });

/**
 * Validation schema for updating an existing profile.
 */
export const updateProfileSchema = z
  .object({
    displayName: z.string().min(2).max(50).optional().describe("Public display name"),
    bio: z.string().max(250).optional().describe("User biography"),
    avatarUrl: z.string().url().optional().describe("Avatar image URL"),
    phoneNumber: z.string().optional().describe("Contact phone number"),
  })
  .meta({
    id: "UpdateProfileInput",
    example: {
      displayName: "Jane Doe (Updated)",
      bio: "Updated biography text.",
    },
  });

/**
 * Validation schema for profile route path parameters.
 */
export const profileParamsSchema = z
  .object({
    id: z.string().min(1, "Profile ID parameter is required").describe("Profile ID"),
  })
  .meta({
    id: "ProfileParams",
    example: {
      id: "prof_12345",
    },
  });

/**
 * Profile entity schema
 */
export const profileSchema = z
  .object({
    id: z.string().describe("Unique profile ID"),
    userId: z.string().describe("Associated user ID"),
    displayName: z.string().describe("Public display name"),
    bio: z.string().optional().describe("User biography"),
    avatarUrl: z.string().optional().describe("Avatar image URL"),
    phoneNumber: z.string().optional().describe("Contact phone number"),
    createdAt: z.string().describe("Creation timestamp"),
    updatedAt: z.string().describe("Last updated timestamp"),
  })
  .meta({
    id: "Profile",
    example: {
      id: "prof_12345",
      userId: "usr_abc123",
      displayName: "Jane Doe",
      bio: "Software developer and open source enthusiast.",
      avatarUrl: "https://example.com/avatars/janedoe.png",
      phoneNumber: "+1234567890",
      createdAt: "2026-09-22T00:00:00.000Z",
      updatedAt: "2026-09-22T00:00:00.000Z",
    },
  });

/**
 * Standardized profile API response schema
 */
export const profileResponseSchema = z
  .object({
    status: z.number(),
    data: profileSchema.nullable(),
    message: z.string(),
  })
  .meta({
    id: "ProfileResponse",
    example: {
      status: 200,
      data: {
        id: "prof_12345",
        userId: "usr_abc123",
        displayName: "Jane Doe",
        bio: "Software developer and open source enthusiast.",
        avatarUrl: "https://example.com/avatars/janedoe.png",
        phoneNumber: "+1234567890",
        createdAt: "2026-09-22T00:00:00.000Z",
        updatedAt: "2026-09-22T00:00:00.000Z",
      },
      message: "Profile retrieved successfully.",
    },
  });
