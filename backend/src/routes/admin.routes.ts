import { Router } from "express";
import { adminController } from "../controllers";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import { adminLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

// Apply middleware to each route individually instead of globally
router.get("/admin/analytics", adminLimiter, authenticate, requireAdmin, adminController.getPlatformAnalytics);
router.get("/admin/creators", adminLimiter, authenticate, requireAdmin, adminController.listCreators);
router.get("/admin/health", adminLimiter, authenticate, requireAdmin, adminController.getHealth);

export default router;
