// In production (deployed on Vercel), the API runs as serverless functions on
// Vercel at https://tipchain-backend.vercel.app — always-on, never sleeps.
// Override with NEXT_PUBLIC_API_URL for local development.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://tipchain-backend.vercel.app";

const TIPCHAIN_API_KEY =
  process.env.NEXT_PUBLIC_TIPCHAIN_API_KEY || "tipchain-api-key";

// ─── Generic Fetch ──────────────────────────────────────────────────────────

type FetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
};

export async function fetchJSON<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, timeout = 15000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": TIPCHAIN_API_KEY,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status >= 500) {
        throw new Error(`Server error (${res.status}). The server may be waking up — please try again in a moment.`);
      }
      throw new Error(`API error ${res.status}: ${text || res.statusText}`);
    }

    return res.json() as Promise<T>;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out — server may be waking up. Please try again.");
    }
    if (err instanceof TypeError && (err as Error).message === "Failed to fetch") {
      throw new Error("Could not reach the server. It may be starting up — please try again in 30 seconds.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreatorResponse {
  id: string;
  walletAddress: string;
  username: string;
  displayName?: string;
  bio: string;
  avatarUrl: string | null;
  socialLinks: Record<string, string> | string;
  totalTips: number;
  supporterCount: number;
  createdAt: string;
}

export interface TransactionResponse {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  amount: number;
  token: string;
  txHash: string | null;
  message: string | null;
  timestamp: string;
  direction?: "sent" | "received";
}

export interface SupporterResponse {
  walletAddress: string;
  totalTipped: number;
  tipCount: number;
}

export interface CreatorDetailResponse {
  creator: CreatorResponse;
  recentTransactions: TransactionResponse[];
  topSupporters: SupporterResponse[];
}

// Jupiter swap types (used by jupiterDirect.ts)
export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: unknown[];
}

export interface SwapToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * 1_000_000_000);
}

function stringifySocialLinks(links: Record<string, string> | string): string {
  if (typeof links === "string") return links;
  return JSON.stringify(links);
}

function parseSocialLinks(links: Record<string, string> | string): Record<string, string> {
  if (typeof links === "object") return links;
  try { return JSON.parse(links); } catch { return {}; }
}

// ─── Creator Endpoints ──────────────────────────────────────────────────────

export async function getCreators(params?: {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.sort) q.set("sort", params.sort);
  if (params?.search) q.set("search", params.search);
  const qs = q.toString();
  // Backend wraps in { data: [...], total, page, totalPages }
  const res = await fetchJSON<{ data: CreatorResponse[]; total: number; page: number; totalPages: number }>(
    `/api/v1/creators${qs ? `?${qs}` : ""}`
  );
  // Normalize: some pages expect { creators: [...] }
  return { creators: res.data ?? res, total: res.total, page: res.page, totalPages: res.totalPages };
}

export async function getCreatorByUsername(username: string) {
  return fetchJSON<CreatorDetailResponse>(`/api/v1/creator/by-username/${username}`);
}

export async function getCreatorByWallet(walletAddress: string) {
  return fetchJSON<CreatorDetailResponse>(`/api/v1/creator/${walletAddress}`);
}

export async function registerCreator(data: {
  walletAddress: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  socialLinks?: Record<string, string> | string;
}) {
  const result = await fetchJSON<CreatorResponse>("/api/v1/creator/register", {
    method: "POST",
    body: {
      ...data,
      socialLinks: data.socialLinks ? stringifySocialLinks(data.socialLinks) : undefined,
    },
  });
  // Pages expect { creator: ... }
  return { creator: { ...result, socialLinks: parseSocialLinks(result.socialLinks) } };
}

export async function updateCreator(
  walletAddress: string,
  data: {
    username?: string;
    bio?: string;
    avatarUrl?: string;
    socialLinks?: Record<string, string> | string;
  }
) {
  const result = await fetchJSON<CreatorResponse>(`/api/v1/creator/${walletAddress}`, {
    method: "PUT",
    body: {
      ...data,
      socialLinks: data.socialLinks ? stringifySocialLinks(data.socialLinks) : undefined,
    },
  });
  // Pages expect { creator: ... }
  return { creator: { ...result, socialLinks: parseSocialLinks(result.socialLinks) } };
}

// Alias for backward compatibility
export const createCreator = registerCreator;

// ─── Transaction Endpoints ──────────────────────────────────────────────────

export async function getTransactions(
  wallet: string,
  limit: number = 25,
  filters?: { token?: string; direction?: string; days?: string | number }
) {
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  if (filters?.token && filters.token !== "ALL") q.set("token", filters.token);
  if (filters?.direction && filters.direction !== "all") q.set("direction", filters.direction);
  if (filters?.days) q.set("days", String(filters.days));
  return fetchJSON<{ transactions: TransactionResponse[]; total: number }>(
    `/api/v1/transactions/${wallet}?${q.toString()}`
  );
}

export async function recordTip(data: {
  senderWallet: string;
  receiverWallet: string;
  amount: number;
  token?: string;
  txHash?: string;
  message?: string;
}) {
  return fetchJSON<TransactionResponse>("/api/v1/transaction", {
    method: "POST",
    body: data,
  });
}

// Alias for backward compatibility
export const recordTransaction = recordTip;

// ─── Health Check ───────────────────────────────────────────────────────────

export async function healthCheck() {
  return fetchJSON<{ status: string; uptime: number }>("/health");
}
