import { Request, Response, NextFunction } from "express";
import { hashApiKey } from "../utils/apiKey";
import { ApiResponse } from "../types/common.types";
import { prisma } from "../lib/prisma";

/**
 * Authenticate using API Key from the X-API-Key header.
 * Falls back to JWT auth if no API key is present.
 */
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers["x-api-key"] as string | undefined;

  if (!apiKey) {
    // No API key — let JWT auth handle it
    return next();
  }

  try {
    const hashedKey = hashApiKey(apiKey);
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: { creator: true },
    });

    if (!keyRecord || !keyRecord.isActive) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid or inactive API key.",
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      const response: ApiResponse = {
        success: false,
        error: "API key has expired.",
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Attach user info from API key
    (req as any).apiKeyAuth = true;
    req.user = {
      id: keyRecord.creator.id,
      walletAddress: keyRecord.creator.walletAddress,
      role: keyRecord.permissions as any,
      isAdmin: keyRecord.permissions === "admin",
    };

    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: "API key authentication failed.",
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
}

/**
 * Require a specific API key permission level.
 * Must be used AFTER authenticateApiKey.
 */
export function requireApiPermission(...levels: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const isApiKeyAuth = (req as any).apiKeyAuth === true;

    // If authenticated via JWT (not API key), skip API key permission check
    if (!isApiKeyAuth) return next();

    const role = req.user?.role as string || "";
    if (!levels.includes(role) && role !== "admin") {
      const response: ApiResponse = {
        success: false,
        error: "Insufficient API key permissions.",
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
}
