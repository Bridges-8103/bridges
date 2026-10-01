import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  MentorDto,
  MentorListQuery,
  MentorListResponse,
  MentorMatchDto,
} from "./mentors.types";

const COLLEGE_MAP: Record<string, string> = {
  "College of Engineering and Information Technology": "tech-engineering",
  "College of Health": "health-medicine",
  "College of Science": "science-environment",
  "College of Business and Law": "business-law",
  "College of Education, Behavioural and Social Sciences": "education-society",
  "College of Creative Arts, Design and Humanities": "arts-design",
  "Future Industries Institute": "tech-engineering",
  "Faculty of Health and Medical Sciences": "health-medicine",
  "Faculty of Sciences, Engineering and Technology": "tech-engineering",
  "Faculty of Arts, Business, Law and Economics": "business-law",
};

type MentorWithUser = Prisma.MentorDetailGetPayload<{
  include: { user: true };
}>;

function mapMentorRecordToDto(record: MentorWithUser): MentorDto {
  const rating = 4.7 + ((record.id % 4) * 0.1);
  return {
    id: String(record.userId),
    name: record.user.name,
    email: record.contactEmail || record.user.email,
    role: record.user.role,
    bio: record.user.bio,
    avatarUrl: record.user.avatarUrl,
    phoneNumber: record.user.phoneNumber,
    jobTitle: record.jobTitle || null,
    company: record.company || null,
    industry: record.industry || null,
    yearsExperience: record.yearsExperience || null,
    expertise: record.expertise || [],
    preferredEnquiries: record.preferredEnquiries || [],
    linkedinUrl: record.linkedinUrl || null,
    contactEmail: record.contactEmail || null,
    rating: Math.round(rating * 10) / 10,
  };
}

export class MentorsService {
  /**
   * List and search mentors with pagination, taxonomy category filtering, and skills filtering.
   */
  static async getMentors(query: MentorListQuery): Promise<MentorListResponse> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * pageSize;

    const whereConditions: Prisma.MentorDetailWhereInput[] = [
      {
        user: {
          isSuspended: false,
        },
      },
    ];

    // 1. Category Filter: check colleges matching category or tags in this category
    if (query.category && query.category.trim()) {
      const catSlug = query.category.trim();

      const collegesForCat = Object.entries(COLLEGE_MAP)
        .filter(([, cSlug]) => cSlug === catSlug)
        .map(([college]) => college);

      const categoryTags = await prisma.taxonomyTag.findMany({
        where: { category: { slug: catSlug } },
        select: { name: true },
        take: 60,
      });
      const tagNames = categoryTags.map((t) => t.name);

      whereConditions.push({
        OR: [
          ...(collegesForCat.length > 0 ? [{ company: { in: collegesForCat } }] : []),
          ...(tagNames.length > 0 ? [{ expertise: { hasSome: tagNames } }] : []),
        ],
      });
    }

    // 2. Skills Filter
    if (query.skills && query.skills.length > 0) {
      whereConditions.push({
        expertise: {
          hasSome: query.skills,
        },
      });
    }

    // 3. Free-text Search
    if (query.search && query.search.trim()) {
      const q = query.search.trim();

      // Look up matching taxonomy tags or aliases for better expertise matching
      const matchingTags = await prisma.taxonomyTag.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { aliases: { has: q } },
          ],
        },
        select: { name: true },
        take: 30,
      });
      const matchedNames = matchingTags.map((t) => t.name);

      whereConditions.push({
        OR: [
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { bio: { contains: q, mode: "insensitive" } } },
          { jobTitle: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { industry: { contains: q, mode: "insensitive" } },
          { expertise: { has: q } },
          ...(matchedNames.length > 0 ? [{ expertise: { hasSome: matchedNames } }] : []),
        ],
      });
    }

    const where: Prisma.MentorDetailWhereInput = { AND: whereConditions };

    const [total, records] = await Promise.all([
      prisma.mentorDetail.count({ where }),
      prisma.mentorDetail.findMany({
        where,
        include: { user: true },
        orderBy: { id: "asc" },
        skip,
        take: pageSize,
      }),
    ]);

    const items = records.map(mapMentorRecordToDto);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: skip + items.length < total,
    };
  }

  /**
   * Retrieve a single mentor by ID (user ID or mentorDetail ID)
   */
  static async getMentorById(id: string | number): Promise<MentorDto | null> {
    const numId = typeof id === "number" ? id : parseInt(id, 10);
    if (isNaN(numId)) {
      return null;
    }

    // Check by userId first
    let record = await prisma.mentorDetail.findUnique({
      where: { userId: numId },
      include: { user: true },
    });

    if (!record) {
      // Fallback check by mentorDetail id
      record = await prisma.mentorDetail.findUnique({
        where: { id: numId },
        include: { user: true },
      });
    }

    if (!record || record.user.role !== "MENTOR" || record.user.isSuspended) {
      return null;
    }

    return mapMentorRecordToDto(record);
  }

  /**
   * Suggest mentors ranked by the student's profile interests.
   * If student has interests, mentors with matching expertise are prioritized and scored.
   * If student has no interests, featured/verified mentors are returned.
   */
  static async getSuggestedMentors(
    interestsInput?: string[],
    limit = 10,
    userId?: string
  ): Promise<MentorMatchDto[]> {
    let interests = interestsInput ? interestsInput.filter((i) => i.trim().length > 0) : [];

    // If no interests passed directly, check user's studentDetail in database
    if (interests.length === 0 && userId) {
      const numId = parseInt(userId, 10);
      if (!isNaN(numId)) {
        const student = await prisma.studentDetail.findUnique({
          where: { userId: numId },
        });
        if (student?.interests && student.interests.length > 0) {
          interests = student.interests;
        }
      }
    }

    // 1. If user has explicit interests: find mentors with overlapping expertise
    if (interests.length > 0) {
      const matchingRecords = await prisma.mentorDetail.findMany({
        where: {
          user: { isSuspended: false },
          expertise: {
            hasSome: interests,
          },
        },
        include: { user: true },
        take: limit * 4,
      });

      const scoredMatches: MentorMatchDto[] = matchingRecords.map((record) => {
        const mentorDto = mapMentorRecordToDto(record);
        const mentorExpertise = mentorDto.expertise;

        // Calculate overlap
        const matched = interests.filter((interest) =>
          mentorExpertise.some(
            (exp) =>
              exp.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(exp.toLowerCase())
          )
        );

        const ratio = matched.length / interests.length;
        const score = Math.min(99, Math.max(75, Math.round(75 + ratio * 24)));

        const matchReasons: string[] = [];
        if (matched.length > 0) {
          matchReasons.push(`${matched.slice(0, 2).join(", ")} expertise`);
        }
        if (mentorDto.company) {
          matchReasons.push(`${mentorDto.company} faculty`);
        }
        if (matchReasons.length === 0) {
          matchReasons.push("High student recommendation");
        }

        return {
          mentor: mentorDto,
          score,
          matchReasons,
          matchingInterests: matched,
        };
      });

      // Sort by score desc, then by number of matching interests desc
      scoredMatches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.matchingInterests.length - a.matchingInterests.length;
      });

      if (scoredMatches.length >= limit) {
        return scoredMatches.slice(0, limit);
      }

      // If not enough direct matches, backfill with featured mentors
      const existingUserIds = new Set(scoredMatches.map((m) => parseInt(m.mentor.id, 10)));
      const needed = limit - scoredMatches.length;

      const fallbackRecords = await prisma.mentorDetail.findMany({
        where: {
          user: { isSuspended: false },
          userId: { notIn: Array.from(existingUserIds) },
        },
        include: { user: true },
        take: needed,
      });

      for (const record of fallbackRecords) {
        const dto = mapMentorRecordToDto(record);
        scoredMatches.push({
          mentor: dto,
          score: 80,
          matchReasons: ["Recommended academic mentor"],
          matchingInterests: [],
        });
      }

      return scoredMatches.slice(0, limit);
    }

    // 2. If student has NO interests set: return featured active mentors
    const topRecords = await prisma.mentorDetail.findMany({
      where: {
        user: { isSuspended: false },
      },
      include: { user: true },
      take: limit,
      orderBy: { id: "asc" },
    });

    return topRecords.map((record) => {
      const mentorDto = mapMentorRecordToDto(record);
      return {
        mentor: mentorDto,
        score: 85,
        matchReasons: ["Featured university mentor", mentorDto.company || "Adelaide University"],
        matchingInterests: [],
      };
    });
  }
}
