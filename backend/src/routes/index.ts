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
import pointsRoutes from "./points.routes";
import vaultRoutes from "./vault.routes";

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
router.use(pointsRoutes);
router.use(vaultRoutes);

// Phase 7-8 routes
import daoRoutes from "./dao.routes";
import graphqlRoutes from "./graphql.routes";
import sdkRoutes from "./sdk.routes";

// AI routes
import aiRoutes, { apiRouter as aiApiRouter } from "./ai.routes";

// GameFi / DeFi / Creator Economy routes
import moduleRoutes from "./module.routes";

router.use(daoRoutes);
router.use(graphqlRoutes);
router.use(sdkRoutes);
router.use(aiRoutes);
router.use(aiApiRouter);
router.use(moduleRoutes);

export default router;
