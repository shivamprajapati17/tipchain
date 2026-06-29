export interface CreatorResponse {
  walletAddress: string;
  username: string;
  displayName?: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  socialLinks: Record<string, string>;
  totalTips: string;
  supporterCount: number;
  followerCount?: number;
  verified?: boolean;
  featured?: boolean;
  createdAt: string;
}

export interface TransactionResponse {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  amount: string;
  token: string;
  txHash: string | null;
  message: string | null;
  timestamp: string;
  direction?: "sent" | "received";
}

export interface AnalyticsOverview {
  totalEarnings: string;
  totalTransactions: number;
  totalSupporters: number;
  totalFollowers: number;
  monthlyEarnings: string;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalTipped: string;
  tipCount: number;
}
