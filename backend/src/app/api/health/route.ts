import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Run a lightweight raw query to verify database connection
    await prisma.$queryRaw`SELECT 1`;

    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      counts: {
        users: userCount,
        posts: postCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
