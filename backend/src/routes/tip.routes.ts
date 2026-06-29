import { Router } from "express";
import { tipController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { apiLimiter, tipLimiter } from "../middleware/rateLimiter.middleware";
import { sendTipSchema, sendSplTipSchema } from "../validators/tip.validator";

const router = Router();

// Tip endpoints
router.post("/tip/send", tipLimiter, authenticate, validateBody(sendTipSchema), tipController.sendTip);
router.post("/tip/spl", tipLimiter, authenticate, validateBody(sendSplTipSchema), tipController.sendSplTip);

// Also support legacy path for backward compatibility
router.post("/transaction", apiLimiter, validateBody(sendTipSchema), tipController.sendTip);

// History & Discovery
router.get("/tip/history", apiLimiter, tipController.getHistory);
router.get("/tip/:creator", apiLimiter, tipController.getByCreator);
router.get("/tip/:supporter", apiLimiter, tipController.getBySupporter);
router.get("/transactions", apiLimiter, tipController.getHistory);
router.get("/transactions/:wallet", apiLimiter, tipController.getByWallet);

// Leaderboard
router.get("/leaderboard", apiLimiter, tipController.getLeaderboard);
router.get("/leaderboard/:wallet", apiLimiter, tipController.getLeaderboard);

export default router;
