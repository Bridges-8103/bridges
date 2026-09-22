import { prisma } from "@/lib/prisma";
import { sendResponse } from "@/lib/sendResponse";

/**
 * System health check
 * @description Verifies API and database availability.
 * @response 200:healthResponseSchema
 * @responseSet public
 * @openapi
 */
export async function GET() {
  try {
    // Verify database connection with a lightweight ping
    await prisma.$queryRaw`SELECT 1`;

    return sendResponse(200, {
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    }, "API and database are healthy.");
  } catch (error) {
    console.error("Health check failed:", error);
    return sendResponse(
      503,
      {
        status: "unhealthy",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      "Database connection failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
