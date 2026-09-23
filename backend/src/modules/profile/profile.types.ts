import { z } from "zod";
import {
  createProfileSchema,
  updateProfileSchema,
  profileParamsSchema,
  studentDetailSchema,
  mentorDetailSchema,
} from "./profile.schema";

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ProfileParams = z.infer<typeof profileParamsSchema>;
export type StudentDetail = z.infer<typeof studentDetailSchema>;
export type MentorDetail = z.infer<typeof mentorDetailSchema>;

export interface Profile {
  id: string;
  userId: string;
  email?: string;
  displayName: string;
  role: "STUDENT" | "MENTOR";
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  studentDetail?: StudentDetail | null;
  mentorDetail?: MentorDetail | null;
  createdAt: string;
  updatedAt: string;
}
