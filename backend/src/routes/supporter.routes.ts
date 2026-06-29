import { Router } from "express";
import { supporterController } from "../controllers";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import { tipController } from "../controllers";

const router = Router();

// Supporter Profiles
router.get("/supporters/:wallet", apiLimiter, supporterController.getProfile);
router.put("/supporters/:wallet", apiLimiter, supporterController.updateProfile);
router.get("/supporters/:wallet/activity", apiLimiter, supporterController.getActivity);

export default router;
