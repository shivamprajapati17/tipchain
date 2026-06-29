import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

vi.mock("../../../src/config/env", () => ({
  getEnv: vi.fn(),
  isProduction: vi.fn().mockReturnValue(false),
}));

vi.mock("../../../src/utils/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  errorHandler,
} from "../../../src/middleware/error.middleware";
import { isProduction } from "../../../src/config/env";
import logger from "../../../src/utils/logger";

function createMockReq(path = "/test"): Partial<Request> {
  return {
    method: "GET",
    path,
    requestId: "req-test-123",
  };
}

function createMockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("AppError", () => {
  it("should create an operational error with default status 500", () => {
    const error = new AppError("Something went wrong");
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error.code).toBeUndefined();
  });

  it("should create an error with custom status and code", () => {
    const error = new AppError("Bad request", 400, "BAD_REQUEST");
    expect(error.message).toBe("Bad request");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
  });

  it("should capture stack trace", () => {
    const error = new AppError("Stack test");
    expect(error.stack).toBeDefined();
  });
});

describe("NotFoundError", () => {
  it("should create 404 error with resource name", () => {
    const error = new NotFoundError("Creator");
    expect(error.message).toBe("Creator not found");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.isOperational).toBe(true);
  });

  it("should default resource to Resource", () => {
    const error = new NotFoundError();
    expect(error.message).toBe("Resource not found");
  });
});

describe("UnauthorizedError", () => {
  it("should create 401 error with default message", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Authentication required");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("should create 401 error with custom message", () => {
    const error = new UnauthorizedError("Invalid token");
    expect(error.message).toBe("Invalid token");
  });
});

describe("ForbiddenError", () => {
  it("should create 403 error", () => {
    const error = new ForbiddenError();
    expect(error.message).toBe("Insufficient permissions");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });
});

describe("ConflictError", () => {
  it("should create 409 error", () => {
    const error = new ConflictError();
    expect(error.message).toBe("Resource already exists");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
  });
});

describe("ValidationError", () => {
  it("should create 400 error with field errors", () => {
    const errors = { username: ["Username is required"], email: ["Invalid email"] };
    const error = new ValidationError(errors);
    expect(error.message).toBe("Validation failed");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.errors).toEqual(errors);
  });
});

describe("errorHandler middleware", () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = vi.fn();
    vi.clearAllMocks();
  });

  it("should handle AppError with correct status code", () => {
    const error = new NotFoundError("Creator");
    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Creator not found",
      })
    );
  });

  it("should include validation errors in response", () => {
    const fieldErrors = { email: ["Invalid format"] };
    const error = new ValidationError(fieldErrors);
    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: { errors: fieldErrors },
      })
    );
  });

  it("should handle Prisma P2002 unique constraint error", () => {
    const error = new Error("Unique constraint failed");
    error.name = "PrismaClientKnownRequestError";
    (error as any).code = "P2002";

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "A record with this value already exists.",
      })
    );
  });

  it("should handle Prisma P2025 not found error", () => {
    const error = new Error("Record not found");
    error.name = "PrismaClientKnownRequestError";
    (error as any).code = "P2025";

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Record not found.",
      })
    );
  });

  it("should handle JSON syntax errors", () => {
    const error = new SyntaxError("Unexpected token");
    (error as any).body = undefined;
    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Invalid JSON in request body.",
      })
    );
  });

  it("should return generic error in production", () => {
    (isProduction as any).mockReturnValue(true);
    const error = new Error("Sensitive details");
    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Internal server error",
      })
    );
  });

  it("should return actual error message in development", () => {
    (isProduction as any).mockReturnValue(false);
    const error = new Error("Database connection failed");
    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Database connection failed",
      })
    );
  });

  it("should log every error with request context", () => {
    const error = new AppError("Logged error", 400);
    errorHandler(error, req as Request, res as Response, next);

    expect(logger.error).toHaveBeenCalledWith(
      "Error: Logged error",
      expect.objectContaining({
        method: "GET",
        path: "/test",
        requestId: "req-test-123",
      })
    );
  });

  it("should include requestId and timestamp in response", () => {
    const error = new AppError("test");
    errorHandler(error, req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "req-test-123",
        timestamp: expect.any(String),
      })
    );
  });
});
