import { defineConfig } from "next-openapi-gen";

export default defineConfig({
  openapi: "3.0.0",
  info: {
    title: "Bridges API",
    version: "1.0.0",
    description: "OpenAPI 3.0 specification for Bridges backend services.",
  },
  servers: [
    {
      url: "http://localhost:3001/api",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT Bearer token acquired from /api/auth/login",
      },
    },
  },
  defaultResponseSet: "common",
  responseSets: {
    common: ["400", "500"],
    public: ["400", "500"],
    auth: ["400", "401", "403", "500"],
    item: ["400", "401", "403", "404", "500"],
  },
  errorConfig: {
    template: {
      type: "object",
      properties: {
        status: {
          type: "integer",
          example: 400,
        },
        data: {
          type: "null",
          nullable: true,
          example: null,
        },
        message: {
          type: "string",
          example: "{{ERROR_MESSAGE}}",
        },
        errors: {
          type: "string",
          example: "{{ERROR_CODE}}",
        },
      },
      required: ["status", "data", "message"],
    },
    codes: {
      "400": {
        description: "Bad Request",
        variables: {
          ERROR_MESSAGE: "Invalid request parameters or body",
          ERROR_CODE: "BAD_REQUEST",
        },
      },
      "401": {
        description: "Unauthorized",
        variables: {
          ERROR_MESSAGE: "Authentication required or token expired",
          ERROR_CODE: "UNAUTHORIZED",
        },
      },
      "403": {
        description: "Forbidden",
        variables: {
          ERROR_MESSAGE: "Access denied: insufficient permissions",
          ERROR_CODE: "FORBIDDEN",
        },
      },
      "404": {
        description: "Not Found",
        variables: {
          ERROR_MESSAGE: "Resource not found",
          ERROR_CODE: "NOT_FOUND",
        },
      },
      "409": {
        description: "Conflict",
        variables: {
          ERROR_MESSAGE: "Resource already exists",
          ERROR_CODE: "CONFLICT",
        },
      },
      "500": {
        description: "Internal Server Error",
        variables: {
          ERROR_MESSAGE: "An unexpected internal server error occurred",
          ERROR_CODE: "INTERNAL_ERROR",
        },
      },
    },
  },
  schemaType: "zod",
  schemaFiles: [],
  docsUrl: "api-docs",
  ui: "scalar",
  outputFile: "openapi.json",
  outputDir: "./public",
  diagnostics: {
    enabled: true,
  },
  ignoreRoutes: [],
  debug: false,
  apiDir: "./src/app/api",
  routerType: "app",
  schemaDir: "./src",
  framework: {
    kind: "nextjs",
    router: "app",
  },
  next: {},
  includeOpenApiRoutes: false,
});
