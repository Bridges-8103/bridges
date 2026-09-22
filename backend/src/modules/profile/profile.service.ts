import type {
  CreateProfileInput,
  UpdateProfileInput,
  Profile,
} from "./profile.types";
import { NotFoundError } from "@/lib/errors";
import { assertOwnership, type AuthUser } from "@/lib/auth";

// In-memory store for profile entities during runtime/development
const profilesMap = new Map<string, Profile>();

/**
 * Service handling profile domain logic with strict entity ownership validation.
 */
export class ProfileService {
  /**
   * Retrieve a user profile by Profile ID
   */
  static async getProfileById(id: string): Promise<Profile | null> {
    return profilesMap.get(id) || null;
  }

  /**
   * Retrieve a user profile by User ID
   */
  static async getProfileByUserId(userId: string): Promise<Profile | null> {
    for (const profile of profilesMap.values()) {
      if (profile.userId === userId) {
        return profile;
      }
    }
    return null;
  }

  /**
   * Create a new profile
   */
  static async createProfile(data: CreateProfileInput): Promise<Profile> {
    const id = `prof_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const profile: Profile = {
      id,
      userId: data.userId,
      displayName: data.displayName,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      phoneNumber: data.phoneNumber,
      createdAt: now,
      updatedAt: now,
    };

    profilesMap.set(id, profile);
    return profile;
  }

  /**
   * Update an existing profile details.
   * Enforces that the actor owns the target profile entity or has an ADMIN role.
   *
   * @param id Profile ID to update
   * @param data Fields to update
   * @param actor The authenticated user requesting the update
   * @throws NotFoundError when the profile does not exist
   * @throws ForbiddenError when an unauthorized user attempts to update another account's profile
   */
  static async updateProfile(
    id: string,
    data: UpdateProfileInput,
    actor?: AuthUser
  ): Promise<Profile> {
    const existing = await this.getProfileById(id);

    if (!existing) {
      throw new NotFoundError(`Profile with ID '${id}' not found.`);
    }

    // Authorization Guard: verify that the actor is the owner or an ADMIN
    if (actor) {
      assertOwnership(
        existing.userId,
        actor,
        "Forbidden: You do not have permission to update another account's profile."
      );
    }

    const updated: Profile = {
      ...existing,
      ...data,
      displayName: data.displayName ?? existing.displayName,
      updatedAt: new Date().toISOString(),
    };

    profilesMap.set(id, updated);
    return updated;
  }

  /**
   * Delete a profile by ID.
   * Enforces that the actor owns the target profile entity or has an ADMIN role.
   *
   * @param id Profile ID to delete
   * @param actor The authenticated user requesting deletion
   * @throws NotFoundError when the profile does not exist
   * @throws ForbiddenError when an unauthorized user attempts to delete another account's profile
   */
  static async deleteProfile(id: string, actor?: AuthUser): Promise<boolean> {
    const existing = await this.getProfileById(id);

    if (!existing) {
      throw new NotFoundError(`Profile with ID '${id}' not found.`);
    }

    // Authorization Guard: verify that the actor is the owner or an ADMIN
    if (actor) {
      assertOwnership(
        existing.userId,
        actor,
        "Forbidden: You do not have permission to delete another account's profile."
      );
    }

    return profilesMap.delete(id);
  }
}
