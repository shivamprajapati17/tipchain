export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface SortParams {
  field: string;
  order: "asc" | "desc";
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface CreatorPublic {
  walletAddress: string;
  username: string;
  displayName: string | null;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  socialLinks: Record<string, string>;
  category: string | null;
  tags: string[];
  featured: boolean;
  verified: boolean;
  totalTips: string;
  supporterCount: number;
  followerCount: number;
  createdAt: string;
}

export interface TipData {
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

export interface SupporterData {
  walletAddress: string;
  totalTipped: string;
  tipCount: number;
  firstTipAt: string;
  lastTipAt: string;
}
