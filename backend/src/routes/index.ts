import { Router } from "express";
import authRoutes from "./auth.routes";
import creatorRoutes from "./creator.routes";
import tipRoutes from "./tip.routes";
import supporterRoutes from "./supporter.routes";
import analyticsRoutes from "./analytics.routes";
import adminRoutes from "./admin.routes";
import notificationRoutes from "./notification.routes";
import webhookRoutes from "./webhook.routes";
import membershipRoutes from "./membership.routes";
import socialRoutes from "./social.routes";
import apiKeyRoutes from "./apiKey.routes";
import blinksRoutes from "./blinks.routes";
import jupiterRoutes from "./jupiter.routes";

const router = Router();

router.use(authRoutes);
router.use(creatorRoutes);
router.use(tipRoutes);
router.use(supporterRoutes);
router.use(analyticsRoutes);
router.use(adminRoutes);
router.use(notificationRoutes);
router.use(webhookRoutes);
router.use(membershipRoutes);
router.use(socialRoutes);
router.use(apiKeyRoutes);
router.use(blinksRoutes);
router.use(jupiterRoutes);

// Phase 7-8 routes
import daoRoutes from "./dao.routes";
import graphqlRoutes from "./graphql.routes";
import sdkRoutes from "./sdk.routes";

router.use(daoRoutes);
router.use(graphqlRoutes);
router.use(sdkRoutes);

export default router;
