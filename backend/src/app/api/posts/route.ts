import { NextRequest, NextResponse } from "next/server";
import { PostService } from "@/modules/posts/post.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authorIdParam = searchParams.get("authorId");
    const publishedParam = searchParams.get("published");

    const posts = await PostService.getPosts({
      authorId: authorIdParam ? parseInt(authorIdParam, 10) : undefined,
      publishedOnly: publishedParam !== null ? publishedParam === "true" : undefined,
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, published, authorId } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { success: false, error: "Title is required and must be a string." },
        { status: 400 }
      );
    }

    if (!authorId || typeof authorId !== "number") {
      return NextResponse.json(
        { success: false, error: "authorId is required and must be a number." },
        { status: 400 }
      );
    }

    const post = await PostService.createPost({
      title,
      content,
      published,
      authorId,
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
