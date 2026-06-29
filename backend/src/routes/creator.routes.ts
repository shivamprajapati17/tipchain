import { Router } from "express";
import { creatorController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody, validateQuery } from "../middleware/validate.middleware";
import { apiLimiter, tipLimiter } from "../middleware/rateLimiter.middleware";
import {
  registerCreatorSchema,
  updateCreatorSchema,
  creatorQuerySchema,
} from "../validators/creator.validator";

const router = Router();

// Creator Registration & Management
router.post("/creator/register", apiLimiter, authenticate, validateBody(registerCreatorSchema), creatorController.register);
router.put("/creator/update", apiLimiter, authenticate, creatorController.update);
router.put("/creator/:wallet", apiLimiter, authenticate, validateBody(updateCreatorSchema), creatorController.update);
router.delete("/creator", apiLimiter, authenticate, creatorController.remove);

// Creator Discovery (Public)
router.get("/creators", apiLimiter, validateQuery(creatorQuerySchema), creatorController.list);
router.get("/creator/profile", authenticate, creatorController.getMyProfile);
router.get("/creator/dashboard", authenticate, creatorController.getDashboard);
router.get("/creator/by-username/:username", apiLimiter, creatorController.getByUsername);
router.get("/creator/:wallet", apiLimiter, creatorController.getByWallet);

// Discovery endpoints
router.get("/creators/search", apiLimiter, creatorController.search);
router.get("/creators/trending", apiLimiter, creatorController.getTrending);
router.get("/creators/featured", apiLimiter, creatorController.getFeatured);
router.get("/creators/recent", apiLimiter, creatorController.getRecent);
router.get("/creators/recommended", apiLimiter, creatorController.getRecommended);

export default router;
