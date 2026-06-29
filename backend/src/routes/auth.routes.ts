import { Router } from "express";
import { authController } from "../controllers";
import { validateBody } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { signInLimiter, authLimiter } from "../middleware/rateLimiter.middleware";
import {
  requestNonceSchema,
  verifySignatureSchema,
  refreshTokenSchema,
} from "../validators/auth.validator";

const router = Router();

// POST /auth/nonce — Request sign-in nonce
router.post("/auth/nonce", signInLimiter, validateBody(requestNonceSchema), authController.requestNonce);

// POST /auth/verify — Verify wallet signature
router.post("/auth/verify", signInLimiter, validateBody(verifySignatureSchema), authController.verifySignature);

// POST /auth/refresh — Refresh access token
router.post("/auth/refresh", authLimiter, validateBody(refreshTokenSchema), authController.refreshToken);

// GET /auth/me — Get current user
router.get("/auth/me", authenticate, authController.getMe);

// POST /auth/logout — Logout
router.post("/auth/logout", authenticate, authController.logout);

export default router;
