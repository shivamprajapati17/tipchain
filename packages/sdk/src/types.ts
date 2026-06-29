/** @tipchain/sdk — Shared Type Definitions */

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
  category?: string | null;
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

export interface SupporterResponse {
  walletAddress: string;
  totalTipped: string;
  tipCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalTipped: string;
  tipCount: number;
}

export interface BadgeResponse {
  id: string;
  name: string;
  slug: string;
  tier: number;
  description?: string;
  imageUrl?: string;
  requirement?: string;
  threshold?: string | null;
  isSoulbound: boolean;
  isLimited: boolean;
  mintAddress?: string;
  awardedAt?: string;
}

export interface MembershipTierResponse {
  id: string;
  name: string;
  description: string;
  price: string;
  token: string;
  benefits: string[];
  color?: string;
  subscriberCount: number;
  maxSubscribers?: number;
}
