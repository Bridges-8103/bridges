export interface CreatePostInput {
  title: string;
  content?: string | null;
  published?: boolean;
  authorId: number;
}

export interface PostFilterOptions {
  publishedOnly?: boolean;
  authorId?: number;
  take?: number;
  skip?: number;
}
