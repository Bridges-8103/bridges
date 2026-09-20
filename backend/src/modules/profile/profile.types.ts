import { z } from "zod";
import {
  createProfileSchema,
  updateProfileSchema,
  profileParamsSchema,
} from "./profile.schema";

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ProfileParams = z.infer<typeof profileParamsSchema>;

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}
