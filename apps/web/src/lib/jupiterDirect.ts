// Direct (browser-to-Jupiter) swap helpers for the Mainnet route.
//
// The backend proxies Jupiter for the Devnet route, but several jup.ag hosts
// (quote-api, swap-api, token.jup.ag) are DNS/connection-blocked from some
// residential + datacenter IPs. The official Jupiter API gateway
// (https://api.jup.ag, the one the @jup-ag/cli uses) is reachable from those
// networks when authenticated with an API key, so it is tried first. Execution
// goes through the public Solana mainnet RPC (publicnode), which allows
// browser CORS requests (api.mainnet-beta.solana.com returns 403 for this
// user's IP range).

import type { SwapQuote, SwapToken } from "./api";

// Jupiter API key (free from https://api.jup.ag). Jupiter keys are public
// rate-limit keys designed for client-side use — they lift the free tier and
// unlock the api.jup.ag gateway.
const JUPITER_API_KEY =
  process.env.NEXT_PUBLIC_JUPITER_API_KEY ||
  "jup_57ccc2432485d89da54f7afb148ef9e1601f172c8c9bcd87ace6a36cf318e3ed";

const JUPITER_V1_BASE = "https://api.jup.ag/swap/v1";
const JUPITER_BASES = [
  JUPITER_V1_BASE,
  "https://quote-api.jup.ag/v6",
  "https://swap-api.jup.ag/v6",
];

export const SOLANA_MAINNET_RPC =
  process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC ||
  "https://solana-rpc.publicnode.com";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function directFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "x-api-key": JUPITER_API_KEY,
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Quote (tries every endpoint, returns the first success) ────────────────

export async function getDirectSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps = 50
): Promise<SwapQuote> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: String(slippageBps),
    onlyDirectRoutes: "false",
    asLegacyTransaction: "false",
  });

  let lastError: unknown = new Error("All Jupiter endpoints unreachable");
  for (const base of JUPITER_BASES) {
    try {
      const res = await directFetch(`${base}/quote?${params}`);
      if (res.ok) return (await res.json()) as SwapQuote;
      lastError = new Error(`Jupiter quote error (${res.status})`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// ─── Swap instructions ──────────────────────────────────────────────────────

export async function getDirectSwapInstructions(
  quoteResponse: SwapQuote,
  userPublicKey: string
): Promise<{
  tokenLedgerInstruction: string | null;
  computeBudgetInstructions: string[];
  setupInstructions: string[];
  swapInstruction: string;
  cleanupInstruction: string | null;
  addressLookupTableAddresses: string[];
}> {
  let lastError: unknown = new Error("All Jupiter endpoints unreachable");
  for (const base of JUPITER_BASES) {
    try {
      const res = await directFetch(`${base}/swap-instructions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey,
          wrapUnwrapSOL: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto",
        }),
      });
      if (res.ok) return await res.json();
      lastError = new Error(`Jupiter instructions error (${res.status})`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// ─── Token search ───────────────────────────────────────────────────────────

export async function getDirectSwapTokens(q: string): Promise<SwapToken[]> {
  // Primary: the api.jup.ag token search (returns {id, icon, ...}[]).
  try {
    const res = await directFetch(
      `https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(q)}`
    );
    if (res.ok) {
      const raw = (await res.json()) as Array<{
        id: string;
        name: string;
        symbol: string;
        icon?: string;
        decimals: number;
      }>;
      return raw.slice(0, 12).map((t) => ({
        address: t.id,
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        logoURI: t.icon,
      }));
    }
  } catch {
    // fall through to the strict endpoint
  }

  // Fallback: the classic strict token list (already SwapToken-shaped).
  const bases = ["https://token.jup.ag", "https://token.lite-api.jup.ag"];
  let lastError: unknown = new Error("All Jupiter token endpoints unreachable");
  for (const base of bases) {
    try {
      const res = await directFetch(`${base}/strict/${encodeURIComponent(q)}`);
      if (res.ok) {
        const raw = (await res.json()) as SwapToken[];
        return raw.slice(0, 12);
      }
      lastError = new Error(`Jupiter token search error (${res.status})`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
