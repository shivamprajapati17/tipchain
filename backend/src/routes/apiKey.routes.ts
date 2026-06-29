import { Router } from "express";
import { apiKeyController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";
import { apiLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

// All API key management requires JWT authentication
router.get("/keys", apiLimiter, authenticate, apiKeyController.listKeys);
router.post("/keys", apiLimiter, authenticate, apiKeyController.createKey);
router.delete("/keys/:id", apiLimiter, authenticate, apiKeyController.deleteKey);
router.put("/keys/:id/toggle", apiLimiter, authenticate, apiKeyController.toggleKey);

export default router;
