/**
 * @tipchain/sdk — Universal JavaScript SDK for TipChain
 *
 * Interact with the TipChain creator monetization platform
 * programmatically. Supports both browser and Node.js environments.
 *
 * @example
 * ```typescript
 * import { TipChain } from "@tipchain/sdk";
 *
 * const client = new TipChain({
 *   apiKey: "tc_...",
 *   environment: "production",
 * });
 *
 * const creator = await client.creators.get("username");
 * ```
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TipChainConfig {
  /** API key for authenticated requests */
  apiKey?: string;
  /** Environment to connect to */
  environment?: "production" | "staging" | "development";
  /** Custom base URL (for self-hosted instances) */
  baseUrl?: string;
}

export interface Creator {
  walletAddress: string;
  username: string;
  displayName?: string | null;
  bio: string;
  avatarUrl: string | null;
  socialLinks: Record<string, string>;
  totalTips: string;
  supporterCount: number;
  verified: boolean;
  createdAt: string;
}

export interface TipInput {
  to: string;
  amount: number;
  token?: "SOL" | "USDC";
  message?: string;
}

export interface TipResult {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  amount: string;
  token: string;
  txHash?: string;
  timestamp: string;
}

export interface AnalyticsOverview {
  totalEarnings: string;
  totalTransactions: number;
  totalSupporters: number;
  monthlyEarnings: string;
}

export type { CreatorResponse, TransactionResponse, SupporterResponse, LeaderboardEntry, BadgeResponse, MembershipTierResponse } from "./types";

// ─── API Error ──────────────────────────────────────────────────────────────

export class TipChainError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = "TipChainError";
  }
}

// ─── Core Client ────────────────────────────────────────────────────────────

export class TipChain {
  public creators: CreatorsAPI;
  public tips: TipsAPI;
  public analytics: AnalyticsAPI;
  private config: Required<TipChainConfig>;

  constructor(config: TipChainConfig = {}) {
    this.config = {
      apiKey: config.apiKey ?? "",
      environment: config.environment ?? "production",
      baseUrl: config.baseUrl ?? this.getDefaultBaseUrl(config.environment),
    };

    this.creators = new CreatorsAPI(this.config);
    this.tips = new TipsAPI(this.config);
    this.analytics = new AnalyticsAPI(this.config);
  }

  private getDefaultBaseUrl(environment?: string): string {
    switch (environment) {
      case "production":
        return "https://api.tipchain.dev/v1";
      case "staging":
        return "https://api.staging.tipchain.dev/v1";
      default:
        return "http://localhost:4000";
    }
  }
}

// ─── Internal HTTP Client ───────────────────────────────────────────────────

class HttpClient {
  constructor(private config: Required<TipChainConfig>) {}

  async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new TipChainError(
        errorBody.error ?? `HTTP ${response.status}`,
        response.status,
        errorBody.code
      );
    }

    return response.json();
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

// ─── Creators API ───────────────────────────────────────────────────────────

export class CreatorsAPI {
  private http: HttpClient;

  constructor(config: Required<TipChainConfig>) {
    this.http = new HttpClient(config);
  }

  /** List all creators (with optional search) */
  async list(options?: {
    q?: string;
    category?: string;
    sort?: "earnings" | "supporters" | "newest";
    limit?: number;
    offset?: number;
  }): Promise<Creator[]> {
    const params = new URLSearchParams();
    if (options?.q) params.set("q", options.q);
    if (options?.category) params.set("category", options.category);
    if (options?.sort) params.set("sort", options.sort);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));

    const res = await this.http.get<{ creators: Creator[] }>(
      `/creators/search?${params}`
    );
    return res.creators;
  }

  /** Get a single creator by username */
  async get(username: string): Promise<{
    creator: Creator;
    recentTransactions: any[];
    topSupporters: any[];
  }> {
    return this.http.get(`/creator/by-username/${encodeURIComponent(username)}`);
  }

  /** Get creator by wallet address */
  async getByWallet(wallet: string): Promise<{
    creator: Creator;
    recentTransactions: any[];
    topSupporters: any[];
  }> {
    return this.http.get(`/creator/${wallet}`);
  }

  /** Create a new creator profile */
  async create(data: {
    walletAddress: string;
    username: string;
    bio?: string;
    socialLinks?: Record<string, string>;
  }): Promise<{ creator: Creator }> {
    return this.http.post("/creator", data);
  }

  /** Update creator profile */
  async update(
    wallet: string,
    data: Partial<{
      username: string;
      bio: string;
      avatarUrl: string | null;
      socialLinks: Record<string, string>;
    }>
  ): Promise<{ creator: Creator }> {
    return this.http.put(`/creator/${wallet}`, data);
  }
}

// ─── Tips API ───────────────────────────────────────────────────────────────

export class TipsAPI {
  private http: HttpClient;

  constructor(config: Required<TipChainConfig>) {
    this.http = new HttpClient(config);
  }

  /** Send a tip (records on-chain + off-chain) */
  async send(input: TipInput): Promise<{ transaction: TipResult }> {
    return this.http.post("/transaction", {
      senderWallet: "", // Wallet handles signing
      receiverWallet: input.to,
      amount: input.amount,
      token: input.token ?? "SOL",
      message: input.message,
    });
  }

  /** Get transactions for a wallet */
  async list(wallet?: string, limit = 20): Promise<{ transactions: TipResult[]; wallet?: string }> {
    const path = wallet
      ? `/transactions/${wallet}?limit=${limit}`
      : `/transactions?limit=${limit}`;
    return this.http.get(path);
  }
}

// ─── Analytics API ──────────────────────────────────────────────────────────

export class AnalyticsAPI {
  private http: HttpClient;

  constructor(config: Required<TipChainConfig>) {
    this.http = new HttpClient(config);
  }

  /** Get dashboard overview for a creator */
  async overview(wallet: string): Promise<{ overview: AnalyticsOverview }> {
    return this.http.get(`/analytics/${wallet}/overview`);
  }

  /** Get revenue chart data */
  async revenue(
    wallet: string,
    days = 30
  ): Promise<{ wallet: string; days: number; revenue: any[] }> {
    return this.http.get(`/analytics/${wallet}/revenue?days=${days}`);
  }

  /** Export transactions as CSV */
  async exportCSV(wallet: string, days = 90): Promise<Response> {
    return fetch(
      `${this.http["config"].baseUrl}/analytics/${wallet}/export?days=${days}`
    );
  }
}
