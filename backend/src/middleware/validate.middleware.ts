import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiResponse } from "../types/common.types";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        const formattedErrors = Object.entries(fieldErrors).map(([field, messages]) => ({
          field,
          message: messages?.join(", ") || "Invalid value",
        }));

        const response: ApiResponse = {
          success: false,
          error: "Validation failed",
          data: { errors: formattedErrors } as any,
          timestamp: new Date().toISOString(),
        };

        res.status(400).json(response);
        return;
      }

      const response: ApiResponse = {
        success: false,
        error: "Validation error",
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
    }
  };
}

/**
 * Validate only request body
 */
export function validateBody(schema: ZodSchema) {
  return validate({ body: schema });
}

/**
 * Validate only request query
 */
export function validateQuery(schema: ZodSchema) {
  return validate({ query: schema });
}

/**
 * Validate only request params
 */
export function validateParams(schema: ZodSchema) {
  return validate({ params: schema });
}
