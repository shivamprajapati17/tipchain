import { Router } from "express";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import {
  getSwapQuote,
  getSwapTxInstructions,
  searchTokensEndpoint,
  getMainnetRpcHealthEndpoint,
} from "../controllers/jupiter.controller";

const router = Router();

// Token swap via Jupiter
router.get("/api/swap/quote", apiLimiter, getSwapQuote);
router.post("/api/swap/instructions", apiLimiter, getSwapTxInstructions);
router.get("/api/swap/tokens", apiLimiter, searchTokensEndpoint);

// Solana mainnet RPC health (mainnet swap route)
router.get("/api/swap/mainnet-rpc-health", apiLimiter, getMainnetRpcHealthEndpoint);

export default router;
