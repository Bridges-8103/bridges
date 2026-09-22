import { z } from "zod";

export const healthResponseDataSchema = z
  .object({
    status: z.string().describe("Health status (e.g., 'healthy')"),
    database: z.string().describe("Database connection status (e.g., 'connected')"),
    timestamp: z.string().describe("ISO timestamp of the health check"),
  })
  .meta({ id: "HealthData" });

export const healthResponseSchema = z
  .object({
    status: z.number().describe("HTTP status code"),
    data: healthResponseDataSchema,
    message: z.string().describe("Status message"),
  })
  .meta({
    id: "HealthResponse",
    example: {
      status: 200,
      data: {
        status: "healthy",
        database: "connected",
        timestamp: "2026-09-22T00:00:00.000Z",
      },
      message: "API and database are healthy.",
    },
  });
