/**
 * Custom error hierarchy for API route handlers.
 * Allows throwing domain and HTTP errors with explicit status codes.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad Request", errors?: unknown) {
    super(400, message, errors);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict occurred") {
    super(409, message);
    this.name = "ConflictError";
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(500, message);
    this.name = "InternalServerError";
  }
}
