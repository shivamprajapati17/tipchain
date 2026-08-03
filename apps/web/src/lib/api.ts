// In production (deployed on Vercel), use the Next.js proxy route to avoid CORS issues
// In development, use the direct backend URL from env or localhost
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/proxy";

// Backend AI/module endpoints are protected by a simple shared-secret API key.
// The n8n workflow and the deployed backend use this same key value.
const TIPCHAIN_API_KEY =
  process.env.NEXT_PUBLIC_TIPCHAIN_API_KEY || "tipchain-api-key";

// ─── Generic Fetch ──────────────────────────────────────────────────────────

async function fetchJSON<T>(
  path: string,
  options?: RequestInit,
  noParse?: boolean
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TIPCHAIN_API_KEY,
    },
    ...options,
  });

  if (noParse) return res as unknown as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error: ${res.status}`);
  }

  const json = await res.json();
  // Handle wrapped API response format: { success: true, data: T, timestamp: "..." }
  if (json && typeof json === "object" && "success" in json && "data" in json) {
    return json.data as T;
  }
  return json as T;
}

// ─── Response Types ─────────────────────────────────────────────────────────

export type CreatorResponse = {
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
};

export type TransactionResponse = {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  amount: string;
  token: string;
  txHash: string | null;
  message: string | null;
  timestamp: string;
  direction?: "sent" | "received";
};

export type SupporterResponse = {
  walletAddress: string;
  totalTipped: string;
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

export type PointsEntry = {
  rank: number;
  walletAddress: string;
  points: number;
  tipCount: number;
  sentPoints: number;
  receivedPoints: number;
  tier: string;
};

export type WalletPoints = {
  wallet: string;
  points: number;
  sentPoints: number;
  receivedPoints: number;
  tipCount: number;
  rank: number | null;
  tier: string;
  nextTier: string | null;
};

export type VaultResponse = {
  id: string;
  name: string;
  description: string;
  ownerWallet: string;
  imageUrl: string | null;
  category: string | null;
  creatorWallets: string[];
  allocations: number[];
  totalTipped: string;
  supporterCount: number;
  tipCount: number;
  isActive: boolean;
  createdAt: string;
  supporters?: { walletAddress: string; totalTipped: string; tipCount: number }[];
};

export type BadgeResponse = {
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
};

export type MembershipTierResponse = {
  id: string;
  name: string;
  description: string;
  price: string;
  token: string;
  benefits: string[];
  color?: string;
  subscriberCount: number;
  maxSubscribers?: number;
  // Token-gating: require supporter to hold a specific token
  requiredToken?: string | null;
  requiredTokenAmount?: string | null;
  requiredTokenSymbol?: string | null;
};

export type NotificationResponse = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

export type AnalyticsOverview = {
  totalEarnings: string;
  totalTransactions: number;
  totalSupporters: number;
  totalFollowers: number;
  monthlyEarnings: string;
  monthlyTransactions: number;
  monthlySupporters: number;
  returningSupporters: number;
  walletBalance: string;
};

export type RevenueDataPoint = {
  date: string;
  amount: string;
  count: number;
};

export type SupporterProfile = {
  walletAddress: string;
  displayName: string | null;
  bio: string;
  avatarUrl: string | null;
  reputation: number;
  totalTipped: string;
  totalTips: number;
  createdAt: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function lamportsToSol(lamports: string | number | bigint): number {
  return Number(lamports) / 1e9;
}

export function solToLamports(sol: number): number {
  return Math.floor(sol * 1e9);
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
  displayName?: string;
  categoryId?: string;
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
    bannerUrl?: string | null;
    displayName?: string;
    categoryId?: string;
    socialLinks?: Record<string, string>;
  }
) {
  return fetchJSON<{ creator: CreatorResponse }>(`/creator/${wallet}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Transactions ───────────────────────────────────────────────────────────

export async function getTransactions(
  wallet?: string,
  limit = 20,
  filters?: { token?: string; direction?: string; days?: string }
) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (filters?.token && filters.token !== "ALL") query.set("token", filters.token);
  if (filters?.direction && filters.direction !== "all") query.set("direction", filters.direction);
  if (filters?.days) query.set("days", filters.days);
  const path = wallet
    ? `/transactions/${wallet}?${query}`
    : `/transactions?${query}`;
  return fetchJSON<{
    transactions: TransactionResponse[];
    wallet?: string;
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }>(path);
}

export async function recordTransaction(data: {
  senderWallet: string;
  receiverWallet: string;
  amount: number;
  token?: string;
  txHash?: string;
  message?: string;
}) {
  return fetchJSON<{ transaction: TransactionResponse }>("/transaction", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Leaderboard ────────────────────────────────────────────────────────────

export async function getLeaderboard(
  limit = 25,
  filters?: { period?: string; token?: string }
) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (filters?.period) query.set("period", filters.period);
  if (filters?.token) query.set("token", filters.token);
  return fetchJSON<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard?${query}`);
}

// ─── TipPoints ──────────────────────────────────────────────────────────────

export async function getPointsLeaderboard(
  limit = 25,
  period = "all",
  token?: string
) {
  const query = new URLSearchParams({ limit: String(limit), period });
  if (token && token !== "ALL") query.set("token", token);
  return fetchJSON<{ leaderboard: PointsEntry[]; period: string }>(
    `/points/leaderboard?${query}`
  );
}

export async function getWalletPoints(wallet: string, period = "all") {
  return fetchJSON<WalletPoints>(`/points/${wallet}?period=${period}`);
}

// ─── Vaults (copy-tipping) ─────────────────────────────────────────────────

export async function getVaults(limit = 24, offset = 0) {
  return fetchJSON<{
    vaults: VaultResponse[];
    pagination: { limit: number; offset: number; total: number };
  }>(`/vaults?limit=${limit}&offset=${offset}`);
}

export async function getVault(id: string) {
  return fetchJSON<VaultResponse>(`/vaults/${id}`);
}

export async function createVault(data: {
  name: string;
  description?: string;
  ownerWallet: string;
  creatorWallets: string[];
  allocations?: number[];
  imageUrl?: string;
  category?: string;
}) {
  return fetchJSON<VaultResponse>("/vaults", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateVault(id: string, data: Record<string, unknown>) {
  return fetchJSON<VaultResponse>(`/vaults/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteVault(id: string, ownerWallet?: string) {
  return fetchJSON<{ success: boolean }>(`/vaults/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ ownerWallet }),
  });
}

export async function supportVault(data: {
  vaultId: string;
  supporterWallet: string;
  amount: number;
  token?: string;
  message?: string;
}) {
  return fetchJSON<{
    success: boolean;
    vaultId: string;
    splits: { creatorWallet: string; amount: string }[];
    vault: VaultResponse | null;
  }>(`/vaults/${data.vaultId}/support`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getVaultTransactions(
  vaultId: string,
  limit = 20,
  offset = 0
) {
  return fetchJSON<{
    vaultId: string;
    transactions: TransactionResponse[];
    pagination: { limit: number; offset: number; total: number };
  }>(`/vaults/${vaultId}/transactions?limit=${limit}&offset=${offset}`);
}

// ─── Supporters ─────────────────────────────────────────────────────────────

export async function getSupporterProfile(wallet: string) {
  return fetchJSON<{
    profile: SupporterProfile;
    badges: BadgeResponse[];
    favoriteCreators: any[];
    following: number;
    recentActivity: any[];
  }>(`/supporters/${wallet}`);
}

export async function updateSupporter(wallet: string, data: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  email?: string | null;
}) {
  return fetchJSON<any>(`/supporters/${wallet}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getSupporterActivity(wallet: string, limit = 50) {
  return fetchJSON<{ wallet: string; activity: any[] }>(
    `/supporters/${wallet}/activity?limit=${limit}`
  );
}

// ─── Badges ─────────────────────────────────────────────────────────────────

export async function getBadges() {
  return fetchJSON<{ badges: BadgeResponse[] }>("/badges");
}

export async function getSupporterBadges(wallet: string) {
  return fetchJSON<{ wallet: string; badges: BadgeResponse[] }>(
    `/badges/supporter/${wallet}`
  );
}

export async function awardBadge(data: {
  badgeSlug: string;
  walletAddress: string;
  creatorWallet?: string;
  mintAddress?: string;
  metadataUri?: string;
}) {
  return fetchJSON<any>("/badges/award", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Memberships ────────────────────────────────────────────────────────────

export async function getCreatorMemberships(wallet: string) {
  return fetchJSON<{ creatorWallet: string; tiers: MembershipTierResponse[] }>(
    `/memberships/${wallet}`
  );
}

export async function createMembershipTier(data: {
  creatorWallet: string;
  name: string;
  description?: string;
  price: number;
  token?: string;
  benefits?: string[];
  color?: string;
  requiredToken?: string;
  requiredTokenAmount?: string;
  requiredTokenSymbol?: string;
}) {
  return fetchJSON<any>("/memberships", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMembershipTier(id: string, data: any) {
  return fetchJSON<any>(`/memberships/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMembershipTier(id: string) {
  return fetchJSON<{ success: boolean }>(`/memberships/${id}`, {
    method: "DELETE",
  });
}

export async function subscribeToTier(tierId: string, supporterWallet: string) {
  return fetchJSON<any>("/memberships/subscribe", {
    method: "POST",
    body: JSON.stringify({ tierId, supporterWallet }),
  });
}

export async function getMySubscriptions(wallet: string) {
  return fetchJSON<{ wallet: string; memberships: any[] }>(
    `/memberships/my/${wallet}`
  );
}

// ─── Social ─────────────────────────────────────────────────────────────────

export async function followCreator(followerWallet: string, creatorWallet: string) {
  return fetchJSON<{ id: string; createdAt: string }>("/follow", {
    method: "POST",
    body: JSON.stringify({ followerWallet, creatorWallet }),
  });
}

export async function unfollowCreator(followerWallet: string, creatorWallet: string) {
  return fetchJSON<{ success: boolean }>(`/follow/${followerWallet}/${creatorWallet}`, {
    method: "DELETE",
  });
}

export async function getFollowers(wallet: string, limit = 50) {
  return fetchJSON<{ creatorWallet: string; followers: any[]; total: number }>(
    `/follow/${wallet}/followers?limit=${limit}`
  );
}

export async function getFollowing(wallet: string, limit = 50) {
  return fetchJSON<{ wallet: string; following: any[] }>(
    `/follow/${wallet}/following?limit=${limit}`
  );
}

export async function addComment(authorWallet: string, creatorWallet: string, content: string) {
  return fetchJSON<any>("/comments", {
    method: "POST",
    body: JSON.stringify({ authorWallet, creatorWallet, content }),
  });
}

export async function getComments(creatorWallet: string, limit = 50) {
  return fetchJSON<{ creatorWallet: string; comments: any[] }>(
    `/comments/${creatorWallet}?limit=${limit}`
  );
}

export async function createUpdate(data: {
  creatorWallet: string;
  title: string;
  content: string;
  imageUrl?: string;
}) {
  return fetchJSON<any>("/updates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getUpdates(creatorWallet: string, limit = 20) {
  return fetchJSON<{ creatorWallet: string; updates: any[] }>(
    `/updates/${creatorWallet}?limit=${limit}`
  );
}

export async function getFeed(wallet: string, limit = 30) {
  return fetchJSON<{ feed: any[] }>(`/feed/${wallet}?limit=${limit}`);
}

// ─── Referrals ──────────────────────────────────────────────────────────────

export async function getReferralStats(wallet: string) {
  return fetchJSON<any>(`/referrals/${wallet}`);
}

export async function createReferralCode(creatorWallet: string) {
  return fetchJSON<any>("/referrals", {
    method: "POST",
    body: JSON.stringify({ creatorWallet }),
  });
}

export async function trackReferralCode(code: string, wallet?: string) {
  const path = wallet
    ? `/referrals/code/${code}?wallet=${wallet}`
    : `/referrals/code/${code}`;
  return fetchJSON<any>(path);
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function getNotifications(wallet: string, unreadOnly = false, limit = 50) {
  const query = unreadOnly ? "?unread=true" : `?limit=${limit}`;
  return fetchJSON<{ wallet: string; unreadCount: number; notifications: NotificationResponse[] }>(
    `/notifications/${wallet}${query}`
  );
}

export async function markNotificationRead(id: string) {
  return fetchJSON<{ success: boolean }>(`/notifications/${id}/read`, {
    method: "PUT",
  });
}

export async function markAllNotificationsRead(wallet: string) {
  return fetchJSON<{ success: boolean }>(`/notifications/read-all/${wallet}`, {
    method: "PUT",
  });
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export async function getAnalyticsOverview(wallet: string) {
  return fetchJSON<{ overview: AnalyticsOverview }>(`/analytics/${wallet}/overview`);
}

export async function getRevenueData(wallet: string, days = 30) {
  return fetchJSON<{ wallet: string; days: number; revenue: RevenueDataPoint[] }>(
    `/analytics/${wallet}/revenue?days=${days}`
  );
}

export async function getTipAnalytics(wallet: string) {
  return fetchJSON<any>(`/analytics/${wallet}/tips`);
}

export async function getGrowthMetrics(wallet: string) {
  return fetchJSON<any>(`/analytics/${wallet}/growth`);
}

export async function exportAnalyticsCSV(wallet: string, days = 90) {
  return fetchJSON<Response>(`/analytics/${wallet}/export?days=${days}`, {}, true);
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function getAdminAnalytics() {
  return fetchJSON<{ platform: any }>("/admin/analytics");
}

export async function getAdminCreators(params?: { verified?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.verified) query.set("verified", params.verified);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  return fetchJSON<any>(`/admin/creators?${query}`);
}

export async function getAdminUsers(limit = 50, offset = 0) {
  return fetchJSON<any>(`/admin/users?limit=${limit}&offset=${offset}`);
}

export async function verifyCreator(wallet: string, verified: boolean) {
  return fetchJSON<any>(`/admin/creators/${wallet}/verify`, {
    method: "PUT",
    body: JSON.stringify({ verified }),
  });
}

export async function featureCreator(wallet: string, featured: boolean) {
  return fetchJSON<any>(`/admin/creators/${wallet}/feature`, {
    method: "PUT",
    body: JSON.stringify({ featured }),
  });
}

export async function getAdminHealth() {
  return fetchJSON<{ status: string; uptime: number; recentTxPerHour: number; activeWallets24h: number }>(
    "/admin/health"
  );
}

// ─── AI Agents ──────────────────────────────────────────────────────────────

export async function queryAIAgent(agentType: string, message: string, context?: Record<string, any>) {
  const endpoint = `/ai/${agentType}`;
  return fetchJSON<{ agent: string; content: string; usage?: any }>(endpoint, {
    method: "POST",
    body: JSON.stringify({ message, context: context || {} }),
  });
}

// ─── DeFi Hub (Phase 4) ──────────────────────────────────────────────────────

export type SwapToken = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  dailyVolume?: string;
  isKnown?: boolean;
};

export type SwapQuote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  routePlan: Array<{ swapInfo: { ammKey: string; label: string }; percent: number }>;
  platformFee: string | null;
  contextSlot: number;
  timeTaken: number;
};

export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps = 50
) {
  const query = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: String(slippageBps),
  });
  return fetchJSON<{
    quote: SwapQuote;
    inputToken: { symbol: string; name: string; decimals: number } | null;
    outputToken: { symbol: string; name: string; decimals: number } | null;
    priceImpact: string;
    routeCount: number;
  }>(`/api/swap/quote?${query}`);
}

export async function getSwapInstructions(quoteResponse: SwapQuote, userPublicKey: string) {
  return fetchJSON<{
    tokenLedgerInstruction: string | null;
    computeBudgetInstructions: string[];
    setupInstructions: string[];
    swapInstruction: string;
    cleanupInstruction: string | null;
    addressLookupTableAddresses: string[];
  }>("/api/swap/instructions", {
    method: "POST",
    body: JSON.stringify({ quoteResponse, userPublicKey }),
  });
}

export async function searchSwapTokens(q: string) {
  return fetchJSON<{ tokens: SwapToken[] }>(`/api/swap/tokens?q=${encodeURIComponent(q)}`);
}

export async function getAlchemySwapHealth() {
  return fetchJSON<{
    rpc: string;
    reachable: boolean;
    blockhash: string | null;
    slot: number | null;
    status: number | null;
    error: string | null;
  }>("/api/swap/alchemy-health");
}

export async function getLending() {
  return fetchJSON<any>("/api/defi/lending");
}

export async function getYieldFarming() {
  return fetchJSON<any>("/api/defi/yield-farming");
}

export async function getTreasury() {
  return fetchJSON<any>("/api/defi/treasury");
}

export async function getCrossChainBridge() {
  return fetchJSON<any>("/api/defi/cross-chain-bridge");
}

// ─── GameFi / DeFi / Creator Economy Modules ─────────────────────────────────

export async function getQuests() {
  return fetchJSON<any>("/api/gamefi/quests");
}

export async function getCollectibles() {
  return fetchJSON<any>("/api/creator/collectibles");
}

export async function getTokenSwaps() {
  return fetchJSON<any>("/api/defi/token-swaps");
}

export async function getNFTDrops() {
  return fetchJSON<any>("/api/creator/nft-drops");
}

export async function getStaking() {
  return fetchJSON<any>("/api/defi/staking");
}

export async function getLiquidityPools() {
  return fetchJSON<any>("/api/defi/liquidity-pools");
}

export async function getGuilds() {
  return fetchJSON<any>("/api/gamefi/guilds");
}

export async function getSeasons() {
  return fetchJSON<any>("/api/gamefi/seasons");
}

export async function getMissions() {
  return fetchJSON<any>("/api/gamefi/missions");
}

export async function getAchievements() {
  return fetchJSON<any>("/api/gamefi/achievements");
}

export const AI_AGENTS = [
  { id: "wallet-assistant", name: "AI Wallet Assistant", icon: "💼", color: "emerald", desc: "Check balances, monitor transactions, and get wallet security advice." },
  { id: "portfolio-manager", name: "AI Portfolio Manager", icon: "📊", color: "blue", desc: "Analyze your DeFi portfolio and get investment insights." },
  { id: "yield-optimizer", name: "AI Yield Optimizer", icon: "🌾", color: "emerald", desc: "Find the best yield opportunities across Solana DeFi." },
  { id: "trading-assistant", name: "AI Trading Assistant", icon: "📈", color: "purple", desc: "Analyze markets, identify trading opportunities, and execute strategies." },
  { id: "community-manager", name: "AI Community Manager", icon: "👥", color: "cyan", desc: "Manage and grow your Web3 communities effectively." },
  { id: "creator-assistant", name: "AI Creator Assistant", icon: "🎨", color: "pink", desc: "Build, manage, and monetize your Web3 creator presence." },
  { id: "quest-generator", name: "AI Quest Generator", icon: "⚔️", color: "orange", desc: "Design engaging quests, missions, and challenges." },
  { id: "npc-engine", name: "AI NPC Engine", icon: "🎭", color: "purple", desc: "Generate NPC characters with personalities and dialogue." },
];

// ─── Categories ─────────────────────────────────────────────────────────────

export async function getCategories() {
  return fetchJSON<{ categories: any[] }>("/categories");
}

export async function searchCreators(params: {
  q?: string;
  category?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.sort) query.set("sort", params.sort);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));
  return fetchJSON<any>(`/creators/search?${query}`);
}

export async function getTrendingCreators() {
  return fetchJSON<{ trending: any[] }>("/creators/trending");
}

export async function getFeaturedCreators() {
  return fetchJSON<{ featured: any[] }>("/creators/featured");
}

export async function getRecentCreators(limit = 10) {
  return fetchJSON<{ recent: any[] }>(`/creators/recent?limit=${limit}`);
}

export async function getRecommendedCreators(wallet?: string, limit = 10) {
  const query = wallet ? `?wallet=${wallet}&limit=${limit}` : `?limit=${limit}`;
  return fetchJSON<{ recommended: any[] }>(`/creators/recommended${query}`);
}
