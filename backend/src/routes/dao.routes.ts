import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import {
  createDAO,
  getDAOs,
  distributeTip,
  addMember,
} from "../controllers/dao.controller";

const router = Router();

router.post("/dao", apiLimiter, authenticate, createDAO);
router.get("/dao/:wallet", apiLimiter, getDAOs);
router.post("/dao/distribute", apiLimiter, authenticate, distributeTip);
router.post("/dao/member", apiLimiter, authenticate, addMember);

export default router;
