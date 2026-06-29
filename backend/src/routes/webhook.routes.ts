import { Router, Request, Response } from "express";
import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import logger from "../utils/logger";
import { getEnv } from "../config/env";

const router = Router();

/**
 * Verify webhook signature from Solana or external services
 */
function verifyWebhookSignature(req: Request, expectedSignature?: string): boolean {
  if (!expectedSignature) return true; // No signature configured
  const signature = req.headers["x-webhook-signature"] as string;
  if (!signature) return false;

  const payload = JSON.stringify(req.body);
  const computed = crypto
    .createHmac("sha256", expectedSignature)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}

// POST /webhooks/solana — Solana transaction confirmation
router.post("/webhooks/solana", apiLimiter, asyncHandler(async (req: Request, res: Response) => {
  logger.info("Solana webhook received", { body: req.body });

  const env = getEnv();
  if (env.HELIUS_API_KEY && !verifyWebhookSignature(req, env.HELIUS_API_KEY)) {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  // Process webhook data
  const { txHash, type, account, amount } = req.body;
  if (txHash && type === "transfer") {
    // Transaction confirmation webhook
    logger.info(`Transaction confirmed: ${txHash}`);
    // Update transaction in database
    try {
      const { prisma } = await import("../lib/prisma");
      await prisma.transaction.update({
        where: { txHash },
        data: {},
      });
    } catch {
      logger.warn(`Webhook: transaction ${txHash} not found in database`);
    }
  }

  sendSuccess(res, { received: true });
}));

// POST /webhooks/helius — Helius webhook endpoint
router.post("/webhooks/helius", apiLimiter, asyncHandler(async (req: Request, res: Response) => {
  logger.info("Helius webhook received", { count: req.body?.length ?? 0 });

  const events = Array.isArray(req.body) ? req.body : [req.body];

  for (const event of events) {
    const { signature, type, accountData } = event;
    if (signature && type) {
      logger.info(`Helius event: ${type}`, { signature });
    }
  }

  sendSuccess(res, { received: true, count: events.length });
}));

// GET /webhooks/health — Webhook health check
router.get("/webhooks/health", (_req: Request, res: Response) => {
  sendSuccess(res, { status: "ok", timestamp: new Date().toISOString() });
});

export default router;
