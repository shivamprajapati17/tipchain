import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { getEnv, isProduction } from "../config/env";
import { ApiResponse } from "../types/common.types";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  public errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Validation failed", 400, "VALIDATION_ERROR");
    this.errors = errors;
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, {
    method: req.method,
    path: req.path,
    requestId: req.requestId,
    stack: isProduction() ? undefined : err.stack,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
      data: (err as any).errors ? { errors: (err as any).errors } : undefined,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as any;
    if (prismaErr.code === "P2002") {
      const response: ApiResponse = {
        success: false,
        error: "A record with this value already exists.",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      };
      res.status(409).json(response);
      return;
    }
    if (prismaErr.code === "P2025") {
      const response: ApiResponse = {
        success: false,
        error: "Record not found.",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      };
      res.status(404).json(response);
      return;
    }
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && "body" in err) {
    const response: ApiResponse = {
      success: false,
      error: "Invalid JSON in request body.",
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };
    res.status(400).json(response);
    return;
  }

  // Default 500 error
  const response: ApiResponse = {
    success: false,
    error: isProduction() ? "Internal server error" : err.message,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };
  res.status(500).json(response);
}
