import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middleware/auth.middleware";
import { apiLimiter } from "../middleware/rateLimiter.middleware";
import { notificationService } from "../services/notification.service";
import { sendSuccess } from "../utils/apiResponse";
import { Request, Response } from "express";

const router = Router();

const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const unreadOnly = req.query.unread === "true";

  const result = await notificationService.getByWallet(wallet, {
    page: 1,
    limit,
    unreadOnly,
  });

  sendSuccess(res, {
    wallet,
    unreadCount: result.unreadCount,
    notifications: result.notifications,
  });
});

const markRead = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await notificationService.markRead(id);
  sendSuccess(res, { success: true });
});

const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const wallet = req.params.wallet as string;
  await notificationService.markAllRead(wallet);
  sendSuccess(res, { success: true });
});

const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress, type, title, body, data } = req.body;
  const notification = await notificationService.create({
    walletAddress,
    type,
    title,
    body,
    data,
  });
  sendSuccess(res, notification);
});

router.get("/notifications/:wallet", apiLimiter, getNotifications);
router.put("/notifications/:id/read", apiLimiter, markRead);
router.put("/notifications/read-all/:wallet", apiLimiter, markAllRead);
router.post("/notifications/create", apiLimiter, createNotification);

export default router;
