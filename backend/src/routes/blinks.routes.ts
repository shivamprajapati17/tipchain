import { Router } from "express";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import {
  getCreatorAction,
  postTipAction,
  getMembershipAction,
  postMembershipAction,
  getDonateAction,
  postDonateAction,
} from "../controllers/blinks.controller";

const router = Router();

// ─── Solana Actions Protocol Endpoints ──────────────────────────────────────
// These follow the Solana Actions spec for Blinks compatibility.
// GET requests return action metadata, POST requests process the action.

// Health / Actions discovery
router.get("/actions.json", (_req, res) => {
  res.json({
    rules: [
      { pathPattern: "/api/actions/**", apiPath: "/api/actions/**" },
    ],
  });
});

// Creator Tip Action
router.get("/api/actions/creator/:wallet", apiLimiter, getCreatorAction);
router.post("/api/actions/creator/:wallet/tip", apiLimiter, postTipAction);

// Membership Subscribe Action
router.get("/api/actions/membership/:creatorWallet/:tierId", apiLimiter, getMembershipAction);
router.post("/api/actions/membership/:creatorWallet/:tierId/subscribe", apiLimiter, postMembershipAction);

// General Donate Action
router.get("/api/actions/donate", apiLimiter, getDonateAction);
router.post("/api/actions/donate", apiLimiter, postDonateAction);

export default router;
