const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ─── Generic Fetch ──────────────────────────────────────────────────────────

async function fetchJSON<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error: ${res.status}`);
  }

  return res.json();
}

// ─── Response Types ─────────────────────────────────────────────────────────

export type CreatorResponse = {
  walletAddress: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  socialLinks: Record<string, string>;
  totalTips: string; // BigInt as string (lamports)
  supporterCount: number;
  createdAt: string;
};

export type TransactionResponse = {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  amount: string; // BigInt as string (lamports)
  token: string;
  txHash: string | null;
  message: string | null;
  timestamp: string;
  direction?: "sent" | "received";
};

export type SupporterResponse = {
  walletAddress: string;
  totalTipped: string; // BigInt as string (lamports)
  tipCount: number;
};

export type CreatorDetailResponse = {
  creator: CreatorResponse;
  recentTransactions: TransactionResponse[];
  topSupporters: SupporterResponse[];
};

export type LeaderboardEntry = {
  rank: number;
  walletAddress: string;
  totalTipped: string;
  tipCount: number;
};

// ─── Helper: lamports to SOL ────────────────────────────────────────────────

export function lamportsToSol(lamports: string | number): number {
  return Number(lamports) / 1e9;
}

// ─── Creators ───────────────────────────────────────────────────────────────

export async function getCreators() {
  return fetchJSON<{ creators: CreatorResponse[] }>("/creators");
}

export async function getCreatorByWallet(wallet: string) {
  return fetchJSON<CreatorDetailResponse>(`/creator/${wallet}`);
}

export async function getCreatorByUsername(username: string) {
  return fetchJSON<CreatorDetailResponse>(`/creator/by-username/${encodeURIComponent(username)}`);
}

export async function createCreator(data: {
  walletAddress: string;
  username: string;
  bio?: string;
  avatarUrl?: string | null;
  socialLinks?: Record<string, string>;
}) {
  return fetchJSON<{ creator: CreatorResponse }>("/creator", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCreator(
  wallet: string,
  data: {
    username?: string;
    bio?: string;
    avatarUrl?: string | null;
    socialLinks?: Record<string, string>;
  }
) {
  return fetchJSON<{ creator: CreatorResponse }>(`/creator/${wallet}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Transactions ───────────────────────────────────────────────────────────

export async function getTransactions(wallet?: string, limit = 20) {
  const path = wallet
    ? `/transactions/${wallet}?limit=${limit}`
    : `/transactions?limit=${limit}`;
  return fetchJSON<{ transactions: TransactionResponse[]; wallet?: string }>(
    path
  );
}

export async function recordTransaction(
  data: {
    senderWallet: string;
    receiverWallet: string;
    amount: number;
    token?: string;
    txHash?: string;
    message?: string;
  }
) {
  return fetchJSON<{ transaction: TransactionResponse }>("/transaction", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 25) {
  return fetchJSON<{ leaderboard: LeaderboardEntry[] }>(
    `/leaderboard?limit=${limit}`
  );
}
