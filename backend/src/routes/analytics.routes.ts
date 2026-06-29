import { Router } from "express";
import { analyticsController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/auth.middleware";
import { apiLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

// Creator Analytics
router.get("/analytics/:wallet/overview", apiLimiter, analyticsController.getOverview);
router.get("/analytics/:wallet/revenue", apiLimiter, analyticsController.getRevenue);
router.get("/analytics/:wallet/tips", apiLimiter, analyticsController.getTipAnalytics);
router.get("/analytics/:wallet/growth", apiLimiter, analyticsController.getGrowth);
router.get("/analytics/:wallet/export", apiLimiter, analyticsController.exportCsv);

export default router;
