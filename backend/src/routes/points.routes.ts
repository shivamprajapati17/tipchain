import { Router } from "express";
import { pointsController } from "../controllers";
import { apiLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

router.get("/points/leaderboard", apiLimiter, pointsController.getPointsLeaderboard);
router.get("/points/:wallet", apiLimiter, pointsController.getWalletPoints);

export default router;
