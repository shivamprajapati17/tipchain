import { Router } from "express";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import {
  getSwapQuote,
  getSwapTxInstructions,
  searchTokensEndpoint,
  getAlchemyHealthEndpoint,
} from "../controllers/jupiter.controller";

const router = Router();

// Token swap via Jupiter
router.get("/api/swap/quote", apiLimiter, getSwapQuote);
router.post("/api/swap/instructions", apiLimiter, getSwapTxInstructions);
router.get("/api/swap/tokens", apiLimiter, searchTokensEndpoint);

// Alchemy Solana mainnet RPC health (mainnet swap route)
router.get("/api/swap/alchemy-health", apiLimiter, getAlchemyHealthEndpoint);

export default router;
