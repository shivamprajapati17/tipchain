import { notificationRepository } from "../repositories/notification.repository";

export class NotificationService {
  async getByWallet(wallet: string, params: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { page = 1, limit = 50, unreadOnly = false } = params;
    const skip = (page - 1) * limit;

    const { notifications, total, unreadCount } = await notificationRepository.findByWallet(wallet, {
      skip,
      take: limit,
      unreadOnly,
    });

    return {
      notifications: notifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data ? JSON.parse(n.data) : null,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      unreadCount,
    };
  }

  async create(data: {
    walletAddress: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    return notificationRepository.create(data);
  }

  async markRead(id: string) {
    return notificationRepository.markRead(id);
  }

  async markAllRead(wallet: string) {
    return notificationRepository.markAllRead(wallet);
  }

  async createTipNotification(sender: string, receiver: string, amount: string, token: string) {
    return this.create({
      walletAddress: receiver,
      type: "tip_received",
      title: "Tip Received",
      body: `You received ${amount} ${token} from ${sender.slice(0, 8)}...`,
      data: { sender, amount, token },
    });
  }

  async createFollowerNotification(follower: string, creator: string) {
    return this.create({
      walletAddress: creator,
      type: "new_follower",
      title: "New Follower",
      body: `${follower.slice(0, 8)}... started following you`,
      data: { follower },
    });
  }

  async createBadgeNotification(wallet: string, badgeName: string) {
    return this.create({
      walletAddress: wallet,
      type: "badge_earned",
      title: "Badge Earned",
      body: `Congratulations! You earned the ${badgeName} badge.`,
      data: { badge: badgeName },
    });
  }
}

export const notificationService = new NotificationService();
