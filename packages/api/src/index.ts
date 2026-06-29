/**
 * @tipchain/api — REST API Client
 *
 * Type-safe HTTP client for the TipChain platform.
 *
 * @example
 * ```typescript
 * import { TipChainAPI } from "@tipchain/api";
 *
 * const api = new TipChainAPI("https://api.tipchain.dev/v1");
 * const { creators } = await api.creators.list();
 * ```
 */

export class TipChainAPI {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, options?: { apiKey?: string }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = options?.apiKey;
  }

  /** Creators endpoints */
  get creators() {
    return new CreatorsEndpoint(this.baseUrl, this.apiKey);
  }

  /** Transactions endpoints */
  get transactions() {
    return new TransactionsEndpoint(this.baseUrl, this.apiKey);
  }

  /** Analytics endpoints */
  get analytics() {
    return new AnalyticsEndpoint(this.baseUrl, this.apiKey);
  }
}

// ─── Internal Request Helper ────────────────────────────────────────────────

async function request<T>(
  baseUrl: string,
  method: string,
  path: string,
  apiKey?: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Creators ───────────────────────────────────────────────────────────────

class CreatorsEndpoint {
  constructor(private baseUrl: string, private apiKey?: string) {}

  list(params?: { q?: string; category?: string; sort?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.category) query.set("category", params.category);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    return request<any>(this.baseUrl, "GET", `/creators/search?${query}`, this.apiKey);
  }

  get(username: string) {
    return request<any>(this.baseUrl, "GET", `/creator/by-username/${encodeURIComponent(username)}`, this.apiKey);
  }

  getByWallet(wallet: string) {
    return request<any>(this.baseUrl, "GET", `/creator/${wallet}`, this.apiKey);
  }

  create(data: any) {
    return request<any>(this.baseUrl, "POST", "/creator", this.apiKey, data);
  }

  update(wallet: string, data: any) {
    return request<any>(this.baseUrl, "PUT", `/creator/${wallet}`, this.apiKey, data);
  }
}

// ─── Transactions ───────────────────────────────────────────────────────────

class TransactionsEndpoint {
  constructor(private baseUrl: string, private apiKey?: string) {}

  list(wallet?: string, limit = 20) {
    const path = wallet ? `/transactions/${wallet}?limit=${limit}` : `/transactions?limit=${limit}`;
    return request<any>(this.baseUrl, "GET", path, this.apiKey);
  }

  create(data: any) {
    return request<any>(this.baseUrl, "POST", "/transaction", this.apiKey, data);
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────

class AnalyticsEndpoint {
  constructor(private baseUrl: string, private apiKey?: string) {}

  overview(wallet: string) {
    return request<any>(this.baseUrl, "GET", `/analytics/${wallet}/overview`, this.apiKey);
  }

  revenue(wallet: string, days = 30) {
    return request<any>(this.baseUrl, "GET", `/analytics/${wallet}/revenue?days=${days}`, this.apiKey);
  }

  exportCSV(wallet: string, days = 90) {
    return fetch(`${this.baseUrl}/analytics/${wallet}/export?days=${days}`);
  }
}

export type { CreatorResponse, TransactionResponse, AnalyticsOverview } from "./types";
