import { Router } from "express";
import { cleanupOldData } from "../jobs/cleanup.job";

const router = Router();

/**
 * Guarded maintenance endpoints for scheduled platform crons.
 *
 * Vercel Cron calls `/internal/cron/cleanup` daily at 03:00 (see
 * `backend/vercel.json`). Requests are accepted when they carry the Vercel
 * cron header or the configured CRON_SECRET (`x-cron-secret`).
 */
router.get("/internal/cron/cleanup", async (req, res) => {
  const fromVercelCron = typeof req.get("x-vercel-cron") === "string";
  const secret = process.env.CRON_SECRET;
  const secretOk = secret ? req.get("x-cron-secret") === secret : false;

  if (!fromVercelCron && !secretOk) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }

  try {
    await cleanupOldData();
    res.json({ success: true, message: "Cleanup job completed" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Cleanup failed";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
