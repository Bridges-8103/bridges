import { z } from "zod";

export const mentorDtoSchema = z
  .object({
    id: z.string().describe("Mentor user ID"),
    name: z.string().describe("Mentor full name"),
    email: z.string().describe("Contact email"),
    role: z.string().default("MENTOR").describe("Role"),
    bio: z.string().nullable().optional().describe("Biography"),
    avatarUrl: z.string().nullable().optional().describe("Avatar image URL"),
    phoneNumber: z.string().nullable().optional().describe("Phone number"),
    jobTitle: z.string().nullable().optional().describe("Current academic or professional title"),
    company: z.string().nullable().optional().describe("College / Institution"),
    industry: z.string().nullable().optional().describe("School / Department"),
    yearsExperience: z.number().nullable().optional().describe("Years of experience"),
    expertise: z.array(z.string()).default([]).describe("Expertise and research topics"),
    preferredEnquiries: z.array(z.string()).default([]).describe("Preferred mentorship enquiries"),
    linkedinUrl: z.string().nullable().optional().describe("LinkedIn profile URL"),
    contactEmail: z.string().nullable().optional().describe("Direct contact email"),
    rating: z.number().default(4.9).describe("Rating score"),
  })
  .meta({
    id: "MentorDto",
    example: {
      id: "1761",
      name: "Mr Srinivas Kamath",
      email: "srinivas.kamath@example.com",
      role: "MENTOR",
      bio: "PhD researcher in neurosciences.",
      avatarUrl: "https://assets.megatunger.com/avatars/mentors/srinivas.kamath.png",
      jobTitle: "Higher Degree by Research Candidate",
      company: "College of Health",
      industry: "School of Pharmacy and Biomedical Sciences",
      expertise: ["Neurosciences", "Microbiology", "Pharmacology & Pharmacy"],
      preferredEnquiries: ["Research Collaboration", "Postgraduate Mentoring"],
      rating: 4.9,
    },
  });

export const mentorQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  skills: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val;
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return 1;
      const parsed = typeof val === "number" ? val : parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return 20;
      const parsed = typeof val === "number" ? val : parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 20 : Math.min(parsed, 100);
    }),
});

export const mentorSuggestionsQuerySchema = z.object({
  interests: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val;
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return 10;
      const parsed = typeof val === "number" ? val : parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 50);
    }),
});

export const mentorParamSchema = z.object({
  id: z.string().min(1, "Mentor ID is required"),
});

export const mentorMatchDtoSchema = z
  .object({
    mentor: mentorDtoSchema,
    score: z.number().describe("Match percentage score (0 - 100)"),
    matchReasons: z.array(z.string()).describe("Bullet points explaining the match"),
    matchingInterests: z.array(z.string()).describe("List of overlapping interest keywords"),
  })
  .meta({
    id: "MentorMatchDto",
  });

export const mentorListResponseSchema = z
  .object({
    status: z.number(),
    data: z.object({
      items: z.array(mentorDtoSchema),
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      hasMore: z.boolean(),
    }),
    message: z.string(),
  })
  .meta({
    id: "MentorListResponse",
  });

export const mentorDetailResponseSchema = z
  .object({
    status: z.number(),
    data: mentorDtoSchema.nullable(),
    message: z.string(),
  })
  .meta({
    id: "MentorDetailResponse",
  });

export const mentorSuggestionsResponseSchema = z
  .object({
    status: z.number(),
    data: z.array(mentorMatchDtoSchema),
    message: z.string(),
  })
  .meta({
    id: "MentorSuggestionsResponse",
  });
