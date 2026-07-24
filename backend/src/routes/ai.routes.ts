import { Router } from "express";
import {
  walletAssistant,
  portfolioManager,
  yieldOptimizer,
  tradingAssistant,
  communityManager,
  creatorAssistant,
  questGenerator,
  npcEngine,
  aiHealth,
} from "../controllers/ai.controller";
import { apiLimiter } from "../middleware/rateLimiter.middleware";

// ─── Base Router: /ai/... ─────────────────────────────────────────────────────
// Accessible as: /ai/wallet-assistant, /api/v1/ai/wallet-assistant
const router = Router();

router.post("/ai/wallet-assistant", apiLimiter, walletAssistant);
router.post("/ai/portfolio-manager", apiLimiter, portfolioManager);
router.post("/ai/yield-optimizer", apiLimiter, yieldOptimizer);
router.post("/ai/trading-assistant", apiLimiter, tradingAssistant);
router.post("/ai/community-manager", apiLimiter, communityManager);
router.post("/ai/creator-assistant", apiLimiter, creatorAssistant);
router.post("/ai/quest-generator", apiLimiter, questGenerator);
router.post("/ai/npc-engine", apiLimiter, npcEngine);
router.get("/ai/health", apiLimiter, aiHealth);

// ─── API Router: /api/ai/... ──────────────────────────────────────────────────
// Matches the exact URLs used by the n8n workflow:
// https://tipchain-api.onrender.com/api/ai/wallet-assistant
const apiRouter = Router();

apiRouter.post("/api/ai/wallet-assistant", apiLimiter, walletAssistant);
apiRouter.post("/api/ai/portfolio-manager", apiLimiter, portfolioManager);
apiRouter.post("/api/ai/yield-optimizer", apiLimiter, yieldOptimizer);
apiRouter.post("/api/ai/trading-assistant", apiLimiter, tradingAssistant);
apiRouter.post("/api/ai/community-manager", apiLimiter, communityManager);
apiRouter.post("/api/ai/creator-assistant", apiLimiter, creatorAssistant);
apiRouter.post("/api/ai/quest-generator", apiLimiter, questGenerator);
apiRouter.post("/api/ai/npc-engine", apiLimiter, npcEngine);
apiRouter.get("/api/ai/health", apiLimiter, aiHealth);

// ─── Export Combined ──────────────────────────────────────────────────────────
// Both routers will be mounted by routes/index.ts
// app.ts mounts all routes at root AND at /api/v1
export { apiRouter };
export default router;
