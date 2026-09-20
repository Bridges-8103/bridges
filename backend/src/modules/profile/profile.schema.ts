import { z } from "zod";

/**
 * Validation schema for creating a new user profile.
 */
export const createProfileSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  bio: z.string().max(250).optional(),
  avatarUrl: z.string().url("Avatar must be a valid URL").optional(),
  phoneNumber: z.string().optional(),
});

/**
 * Validation schema for updating an existing profile.
 */
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(250).optional(),
  avatarUrl: z.string().url().optional(),
  phoneNumber: z.string().optional(),
});

/**
 * Validation schema for profile route path parameters.
 */
export const profileParamsSchema = z.object({
  id: z.string().min(1, "Profile ID parameter is required"),
});
