import { z } from "zod";

export const studentDetailSchema = z.object({
  university: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  fieldOfStudy: z.string().nullable().optional(),
  yearOfStudy: z.number().nullable().optional(),
  interests: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  careerGoals: z.string().nullable().optional(),
});

export const mentorDetailSchema = z.object({
  jobTitle: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  yearsExperience: z.number().nullable().optional(),
  expertise: z.array(z.string()).default([]),
  preferredEnquiries: z.array(z.string()).default([]),
  linkedinUrl: z.string().nullable().optional(),
});

/**
 * Validation schema for creating a new user profile.
 */
export const createProfileSchema = z
  .object({
    userId: z.string().min(1, "User ID is required").describe("Associated user ID"),
    displayName: z.string().min(2, "Display name must be at least 2 characters").max(50).describe("Public display name"),
    email: z.string().email().optional().describe("User email address"),
    role: z.enum(["STUDENT", "MENTOR"]).default("STUDENT").describe("User role"),
    bio: z.string().max(250).optional().describe("User biography"),
    avatarUrl: z.string().url("Avatar must be a valid URL").optional().describe("Avatar image URL"),
    phoneNumber: z.string().optional().describe("Contact phone number"),

    // Student fields
    university: z.string().optional(),
    degree: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    yearOfStudy: z.number().int().optional(),
    interests: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    careerGoals: z.string().optional(),

    // Mentor fields
    jobTitle: z.string().optional(),
    company: z.string().optional(),
    industry: z.string().optional(),
    yearsExperience: z.number().int().optional(),
    expertise: z.array(z.string()).optional(),
    preferredEnquiries: z.array(z.string()).optional(),
    linkedinUrl: z.string().optional(),
  })
  .meta({
    id: "CreateProfileInput",
    example: {
      userId: "usr_abc123",
      displayName: "Jane Doe",
      role: "STUDENT",
      bio: "Software developer and student.",
      avatarUrl: "https://example.com/avatars/janedoe.png",
      phoneNumber: "+1234567890",
      university: "Stanford University",
      degree: "Computer Science",
      yearOfStudy: 3,
    },
  });

/**
 * Validation schema for updating an existing profile.
 */
export const updateProfileSchema = z
  .object({
    displayName: z.string().min(2).max(50).optional().describe("Public display name"),
    role: z.enum(["STUDENT", "MENTOR"]).optional().describe("User role"),
    bio: z.string().max(250).optional().describe("User biography"),
    avatarUrl: z.string().url().optional().describe("Avatar image URL"),
    phoneNumber: z.string().optional().describe("Contact phone number"),

    // Student fields
    university: z.string().optional(),
    degree: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    yearOfStudy: z.number().int().optional(),
    interests: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    careerGoals: z.string().optional(),

    // Mentor fields
    jobTitle: z.string().optional(),
    company: z.string().optional(),
    industry: z.string().optional(),
    yearsExperience: z.number().int().optional(),
    expertise: z.array(z.string()).optional(),
    preferredEnquiries: z.array(z.string()).optional(),
    linkedinUrl: z.string().optional(),
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
    email: z.string().optional().describe("User email address"),
    displayName: z.string().describe("Public display name"),
    role: z.enum(["STUDENT", "MENTOR"]).describe("User role"),
    bio: z.string().optional().describe("User biography"),
    avatarUrl: z.string().optional().describe("Avatar image URL"),
    phoneNumber: z.string().optional().describe("Contact phone number"),
    studentDetail: studentDetailSchema.nullable().optional(),
    mentorDetail: mentorDetailSchema.nullable().optional(),
    createdAt: z.string().describe("Creation timestamp"),
    updatedAt: z.string().describe("Last updated timestamp"),
  })
  .meta({
    id: "Profile",
    example: {
      id: "1",
      userId: "usr_abc123",
      email: "jane@university.edu",
      displayName: "Jane Doe",
      role: "STUDENT",
      bio: "Software engineering student.",
      avatarUrl: "https://example.com/avatars/janedoe.png",
      phoneNumber: "+1234567890",
      studentDetail: {
        university: "Stanford University",
        degree: "BS",
        fieldOfStudy: "Computer Science",
        yearOfStudy: 3,
        interests: ["AI", "Startups"],
        skills: ["TypeScript", "React"],
        careerGoals: "Full-stack engineer",
      },
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
        id: "1",
        userId: "usr_abc123",
        email: "jane@university.edu",
        displayName: "Jane Doe",
        role: "STUDENT",
        bio: "Software engineering student.",
        avatarUrl: "https://example.com/avatars/janedoe.png",
        phoneNumber: "+1234567890",
        createdAt: "2026-09-22T00:00:00.000Z",
        updatedAt: "2026-09-22T00:00:00.000Z",
      },
      message: "Profile retrieved successfully.",
    },
  });
