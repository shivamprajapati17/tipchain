import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated, sendDeleted } from "../utils/apiResponse";
import { generateApiKey } from "../utils/apiKey";
import { prisma } from "../lib/prisma";
import logger from "../utils/logger";

/**
 * List all API keys for the authenticated creator
 */
export const listKeys = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: "Not authenticated" });
    return;
  }

  const keys = await prisma.apiKey.findMany({
    where: { creatorId: req.user.id },
    select: {
      id: true,
      name: true,
      prefix: true,
      permissions: true,
      lastUsedAt: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  sendSuccess(res, { keys });
});

/**
 * Create a new API key
 */
export const createKey = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: "Not authenticated" });
    return;
  }

  const body = req.body || {};
  const name: string = typeof body.name === "string" ? body.name : "";
  const permissions: string = typeof body.permissions === "string" ? body.permissions : "read";
  const expiresInDays: number = typeof body.expiresInDays === "number" ? body.expiresInDays : 0;

  if (!name || name.trim().length === 0) {
    res.status(400).json({ success: false, error: "Key name is required" });
    return;
  }

  // Generate the key
  const { rawKey, prefix, hashedKey } = generateApiKey(name);

  // Calculate expiration
  let expiresAt: Date | null = null;
  if (expiresInDays && typeof expiresInDays === "number" && expiresInDays > 0) {
    expiresAt = new Date(Date.now() + expiresInDays * 86400000);
  }

  const keyRecord = await prisma.apiKey.create({
    data: {
      creatorId: req.user.id,
      name: name.trim(),
      key: hashedKey,
      prefix,
      permissions: ["read", "write", "admin"].includes(permissions) ? permissions : "read",
      expiresAt,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      permissions: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  logger.info("API key created", { userId: req.user.id, name: keyRecord.name });

  // Return the raw key ONCE — it will never be shown again
  sendCreated(res, {
    ...keyRecord,
    rawKey, // This is the only time the full key is returned
    message: "Save this key securely — it will not be shown again.",
  }, "API key created");
});

/**
 * Delete an API key
 */
export const deleteKey = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: "Not authenticated" });
    return;
  }

  const keyId = req.params.id as string;
  const keyRecord = await prisma.apiKey.findUnique({ where: { id: keyId } });

  if (!keyRecord || keyRecord.creatorId !== req.user.id) {
    res.status(404).json({ success: false, error: "API key not found" });
    return;
  }

  await prisma.apiKey.delete({ where: { id: keyId } });
  logger.info("API key deleted", { userId: req.user.id, keyId });

  sendDeleted(res, "API key deleted");
});

/**
 * Toggle API key active/inactive
 */
export const toggleKey = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: "Not authenticated" });
    return;
  }

  const keyId = req.params.id as string;
  const keyRecord = await prisma.apiKey.findUnique({ where: { id: keyId } });

  if (!keyRecord || keyRecord.creatorId !== req.user.id) {
    res.status(404).json({ success: false, error: "API key not found" });
    return;
  }

  const updated = await prisma.apiKey.update({
    where: { id: keyId },
    data: { isActive: !keyRecord.isActive },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      permissions: true,
    },
  });

  sendSuccess(res, updated, updated.isActive ? "API key activated" : "API key deactivated");
});
