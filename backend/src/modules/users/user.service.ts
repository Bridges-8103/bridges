import { prisma } from "@/lib/prisma";
import type { CreateUserInput, UpdateUserInput } from "./user.types";

export class UserService {
  /**
   * Retrieve all users with post count summary
   */
  static async getUsers() {
    return prisma.user.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { id: "asc" },
    });
  }

  /**
   * Find a specific user by ID, optionally including posts
   */
  static async getUserById(id: number, includePosts = false) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        posts: includePosts,
      },
    });
  }

  /**
   * Find a specific user by email
   */
  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserInput) {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Update an existing user
   */
  static async updateUser(id: number, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a user by ID
   */
  static async deleteUser(id: number) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
