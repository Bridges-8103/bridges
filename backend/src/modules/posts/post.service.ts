import { prisma } from "@/lib/prisma";
import type { CreatePostInput, PostFilterOptions } from "./post.types";

export class PostService {
  /**
   * Fetch posts with optional author and published filter
   */
  static async getPosts(options: PostFilterOptions = {}) {
    const { publishedOnly, authorId, take = 50, skip = 0 } = options;

    return prisma.post.findMany({
      where: {
        ...(publishedOnly !== undefined ? { published: publishedOnly } : {}),
        ...(authorId !== undefined ? { authorId } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { id: "desc" },
      take,
      skip,
    });
  }

  /**
   * Find a single post by ID
   */
  static async getPostById(id: number) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });
  }

  /**
   * Create a new post
   */
  static async createPost(data: CreatePostInput) {
    return prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        published: data.published ?? false,
        authorId: data.authorId,
      },
      include: {
        author: true,
      },
    });
  }

  /**
   * Toggle published state of a post
   */
  static async setPublished(id: number, published: boolean) {
    return prisma.post.update({
      where: { id },
      data: { published },
    });
  }

  /**
   * Delete a post by ID
   */
  static async deletePost(id: number) {
    return prisma.post.delete({
      where: { id },
    });
  }
}
