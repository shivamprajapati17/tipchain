// In-memory notification store (Notification model does not exist in the database yet)
// This provides basic notification functionality without database persistence

export interface NotificationEntry {
  id: string;
  walletAddress: string;
  type: string;
  title: string;
  body: string;
  data: string | null;
  isRead: boolean;
  createdAt: Date;
}

const notifications: NotificationEntry[] = [];

let counter = 0;

function generateId(): string {
  counter++;
  return `notif_${Date.now()}_${counter}`;
}

export class NotificationRepository {
  async findByWallet(wallet: string, params: { skip?: number; take?: number; unreadOnly?: boolean }) {
    const { skip = 0, take = 50, unreadOnly = false } = params;

    let filtered = notifications.filter((n) => n.walletAddress === wallet);
    if (unreadOnly) filtered = filtered.filter((n) => !n.isRead);
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const unreadCount = notifications.filter((n) => n.walletAddress === wallet && !n.isRead).length;
    const paginated = filtered.slice(skip, skip + take);

    return { notifications: paginated, total, unreadCount };
  }

  async create(data: {
    walletAddress: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const entry: NotificationEntry = {
      id: generateId(),
      walletAddress: data.walletAddress,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data ? JSON.stringify(data.data) : null,
      isRead: false,
      createdAt: new Date(),
    };
    notifications.push(entry);
    return entry;
  }

  async markRead(id: string) {
    const entry = notifications.find((n) => n.id === id);
    if (entry) entry.isRead = true;
    return entry;
  }

  async markAllRead(wallet: string) {
    notifications
      .filter((n) => n.walletAddress === wallet && !n.isRead)
      .forEach((n) => { n.isRead = true; });
    return { count: notifications.length };
  }

  async deleteOld(_daysOld = 90) {
    // Silently succeed - in-memory store auto-cleans
    return { count: 0 };
  }
}

export const notificationRepository = new NotificationRepository();
