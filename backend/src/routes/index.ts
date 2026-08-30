import { Router } from "express";
import authRoutes from "./auth.routes";
import creatorRoutes from "./creator.routes";
import tipRoutes from "./tip.routes";
import supporterRoutes from "./supporter.routes";

const router = Router();

router.use(authRoutes);
router.use(creatorRoutes);
router.use(tipRoutes);
router.use(supporterRoutes);

export default router;
