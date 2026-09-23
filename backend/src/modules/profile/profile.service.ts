import type {
  CreateProfileInput,
  UpdateProfileInput,
  Profile,
} from "./profile.types";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { type AuthUser } from "@/lib/auth";

type PrismaUserWithDetails = {
  id: number;
  name: string;
  email: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  bio: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  studentDetail: {
    university: string | null;
    degree: string | null;
    fieldOfStudy: string | null;
    yearOfStudy: number | null;
    interests: string[];
    skills: string[];
    careerGoals: string | null;
  } | null;
  mentorDetail: {
    jobTitle: string | null;
    company: string | null;
    industry: string | null;
    yearsExperience: number | null;
    expertise: string[];
    preferredEnquiries: string[];
    linkedinUrl: string | null;
  } | null;
};

function mapUserToProfile(user: PrismaUserWithDetails): Profile {
  return {
    id: String(user.id),
    userId: String(user.id),
    email: user.email,
    displayName: user.name,
    role: (user.role === "MENTOR" ? "MENTOR" : "STUDENT") as "STUDENT" | "MENTOR",
    bio: user.bio || undefined,
    avatarUrl: user.avatarUrl || undefined,
    phoneNumber: user.phoneNumber || undefined,
    studentDetail: user.studentDetail
      ? {
          university: user.studentDetail.university,
          degree: user.studentDetail.degree,
          fieldOfStudy: user.studentDetail.fieldOfStudy,
          yearOfStudy: user.studentDetail.yearOfStudy,
          interests: user.studentDetail.interests || [],
          skills: user.studentDetail.skills || [],
          careerGoals: user.studentDetail.careerGoals,
        }
      : null,
    mentorDetail: user.mentorDetail
      ? {
          jobTitle: user.mentorDetail.jobTitle,
          company: user.mentorDetail.company,
          industry: user.mentorDetail.industry,
          yearsExperience: user.mentorDetail.yearsExperience,
          expertise: user.mentorDetail.expertise || [],
          preferredEnquiries: user.mentorDetail.preferredEnquiries || [],
          linkedinUrl: user.mentorDetail.linkedinUrl,
        }
      : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * Service handling profile persistence with Prisma
 */
export class ProfileService {
  /**
   * Retrieve a user profile by Profile / User ID (numeric or string)
   */
  static async getProfileById(id: string): Promise<Profile | null> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: numId },
      include: { studentDetail: true, mentorDetail: true },
    });

    return user ? mapUserToProfile(user as PrismaUserWithDetails) : null;
  }

  /**
   * Retrieve a user profile by authenticated user info (email or id)
   */
  static async getProfileByUserIdOrEmail(userId: string, email?: string): Promise<Profile | null> {
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { studentDetail: true, mentorDetail: true },
      });
      if (user) {
        return mapUserToProfile(user as PrismaUserWithDetails);
      }
    }

    const numId = parseInt(userId, 10);
    if (!isNaN(numId)) {
      const user = await prisma.user.findUnique({
        where: { id: numId },
        include: { studentDetail: true, mentorDetail: true },
      });
      if (user) {
        return mapUserToProfile(user as PrismaUserWithDetails);
      }
    }

    return null;
  }

  /**
   * Alias for backward compatibility
   */
  static async getProfileByUserId(userId: string): Promise<Profile | null> {
    return this.getProfileByUserIdOrEmail(userId);
  }

  /**
   * Create or update a user profile
   */
  static async createProfile(data: CreateProfileInput, actor?: AuthUser): Promise<Profile> {
    const email = data.email || actor?.email;
    if (!email) {
      throw new Error("User email is required to associate profile.");
    }

    const role = data.role === "MENTOR" ? "MENTOR" : "STUDENT";

    // Upsert User
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: data.displayName,
        role,
        bio: data.bio || null,
        phoneNumber: data.phoneNumber || null,
      },
      update: {
        name: data.displayName,
        role,
        bio: data.bio !== undefined ? data.bio : undefined,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : undefined,
      },
    });

    // Handle role details
    if (role === "STUDENT") {
      await prisma.studentDetail.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          university: data.university || null,
          degree: data.degree || null,
          fieldOfStudy: data.fieldOfStudy || null,
          yearOfStudy: data.yearOfStudy || null,
          interests: data.interests || [],
          skills: data.skills || [],
          careerGoals: data.careerGoals || null,
        },
        update: {
          university: data.university !== undefined ? data.university : undefined,
          degree: data.degree !== undefined ? data.degree : undefined,
          fieldOfStudy: data.fieldOfStudy !== undefined ? data.fieldOfStudy : undefined,
          yearOfStudy: data.yearOfStudy !== undefined ? data.yearOfStudy : undefined,
          interests: data.interests !== undefined ? data.interests : undefined,
          skills: data.skills !== undefined ? data.skills : undefined,
          careerGoals: data.careerGoals !== undefined ? data.careerGoals : undefined,
        },
      });
    } else if (role === "MENTOR") {
      await prisma.mentorDetail.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          jobTitle: data.jobTitle || null,
          company: data.company || null,
          industry: data.industry || null,
          yearsExperience: data.yearsExperience || null,
          expertise: data.expertise || [],
          preferredEnquiries: data.preferredEnquiries || [],
          linkedinUrl: data.linkedinUrl || null,
        },
        update: {
          jobTitle: data.jobTitle !== undefined ? data.jobTitle : undefined,
          company: data.company !== undefined ? data.company : undefined,
          industry: data.industry !== undefined ? data.industry : undefined,
          yearsExperience: data.yearsExperience !== undefined ? data.yearsExperience : undefined,
          expertise: data.expertise !== undefined ? data.expertise : undefined,
          preferredEnquiries: data.preferredEnquiries !== undefined ? data.preferredEnquiries : undefined,
          linkedinUrl: data.linkedinUrl !== undefined ? data.linkedinUrl : undefined,
        },
      });
    }

    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      include: { studentDetail: true, mentorDetail: true },
    });

    return mapUserToProfile(refreshed as PrismaUserWithDetails);
  }

  /**
   * Update an existing profile
   */
  static async updateProfile(
    id: string,
    data: UpdateProfileInput,
    actor?: AuthUser
  ): Promise<Profile> {
    let existing = await this.getProfileById(id);
    if (!existing && actor?.email) {
      existing = await this.getProfileByUserIdOrEmail(actor.id, actor.email);
    }

    if (!existing) {
      // If not yet existing, create it
      return this.createProfile(
        {
          userId: actor?.id || id,
          displayName: data.displayName || "User",
          email: actor?.email,
          role: data.role || "STUDENT",
          ...data,
        },
        actor
      );
    }

    const numId = parseInt(existing.id, 10);
    const role = data.role ? (data.role === "MENTOR" ? "MENTOR" : "STUDENT") : existing.role;

    await prisma.user.update({
      where: { id: numId },
      data: {
        name: data.displayName !== undefined ? data.displayName : undefined,
        role: data.role ? (role as "STUDENT" | "MENTOR") : undefined,
        bio: data.bio !== undefined ? data.bio : undefined,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : undefined,
      },
    });

    if (role === "STUDENT") {
      await prisma.studentDetail.upsert({
        where: { userId: numId },
        create: {
          userId: numId,
          university: data.university || null,
          degree: data.degree || null,
          fieldOfStudy: data.fieldOfStudy || null,
          yearOfStudy: data.yearOfStudy || null,
          interests: data.interests || [],
          skills: data.skills || [],
          careerGoals: data.careerGoals || null,
        },
        update: {
          university: data.university !== undefined ? data.university : undefined,
          degree: data.degree !== undefined ? data.degree : undefined,
          fieldOfStudy: data.fieldOfStudy !== undefined ? data.fieldOfStudy : undefined,
          yearOfStudy: data.yearOfStudy !== undefined ? data.yearOfStudy : undefined,
          interests: data.interests !== undefined ? data.interests : undefined,
          skills: data.skills !== undefined ? data.skills : undefined,
          careerGoals: data.careerGoals !== undefined ? data.careerGoals : undefined,
        },
      });
    } else if (role === "MENTOR") {
      await prisma.mentorDetail.upsert({
        where: { userId: numId },
        create: {
          userId: numId,
          jobTitle: data.jobTitle || null,
          company: data.company || null,
          industry: data.industry || null,
          yearsExperience: data.yearsExperience || null,
          expertise: data.expertise || [],
          preferredEnquiries: data.preferredEnquiries || [],
          linkedinUrl: data.linkedinUrl || null,
        },
        update: {
          jobTitle: data.jobTitle !== undefined ? data.jobTitle : undefined,
          company: data.company !== undefined ? data.company : undefined,
          industry: data.industry !== undefined ? data.industry : undefined,
          yearsExperience: data.yearsExperience !== undefined ? data.yearsExperience : undefined,
          expertise: data.expertise !== undefined ? data.expertise : undefined,
          preferredEnquiries: data.preferredEnquiries !== undefined ? data.preferredEnquiries : undefined,
          linkedinUrl: data.linkedinUrl !== undefined ? data.linkedinUrl : undefined,
        },
      });
    }

    const refreshed = await prisma.user.findUnique({
      where: { id: numId },
      include: { studentDetail: true, mentorDetail: true },
    });

    return mapUserToProfile(refreshed as PrismaUserWithDetails);
  }

  /**
   * Delete a profile by ID
   */
  static async deleteProfile(id: string, actor?: AuthUser): Promise<boolean> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      throw new NotFoundError(`Profile with ID '${id}' not found.`);
    }

    if (actor) {
      // Optional check if actor is provided
    }

    await prisma.user.delete({ where: { id: numId } });
    return true;
  }
}
