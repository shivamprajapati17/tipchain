import { Request, Response, NextFunction } from "express";
import { getEnv } from "../config/env";
import { ApiResponse } from "../types/common.types";

/**
 * Simple shared-secret API key authentication middleware.
 * Validates the x-api-key header against the TIPCHAIN_API_KEY environment variable.
 * If the env var is not set, authentication is skipped (allow all).
 */
export function simpleApiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const env = getEnv();
  const expectedKey = env.TIPCHAIN_API_KEY;

  // If no API key is configured, allow all requests
  if (!expectedKey) {
    return next();
  }

  const providedKey = req.headers["x-api-key"] as string | undefined;

  if (!providedKey) {
    const response: ApiResponse = {
      success: false,
      error: "API key is required. Provide it via the x-api-key header.",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  if (providedKey !== expectedKey) {
    const response: ApiResponse = {
      success: false,
      error: "Invalid API key.",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  next();
}
