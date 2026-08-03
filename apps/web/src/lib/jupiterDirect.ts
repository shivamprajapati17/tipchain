// Direct (browser-to-Jupiter) swap helpers for the Mainnet route.
//
// The backend proxies Jupiter for the Devnet route, but some hosters' datacenter
// IPs are blocked by jup.ag's Cloudflare. Browsers (residential IPs) reach the
// Jupiter API fine, so on Mainnet we query it directly from the client and
// execute through the Alchemy Solana mainnet RPC.

import type { SwapQuote } from "./api";

const JUPITER_BASES = [
  "https://quote-api.jup.ag/v6",
  "https://swap-api.jup.ag/v6",
  "https://lite-api.jup.ag/v6",
];

export const ALCHEMY_MAINNET_RPC =
  process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC ||
  "https://solana-mainnet.g.alchemy.com/v2/n7DahlsU99piB6nKG2mq3";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function directFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
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

export async function getDirectSwapTokens(q: string) {
  const bases = ["https://token.jup.ag", "https://token.lite-api.jup.ag"];
  let lastError: unknown = new Error("All Jupiter token endpoints unreachable");
  for (const base of bases) {
    try {
      const res = await directFetch(`${base}/strict/${encodeURIComponent(q)}`);
      if (res.ok) return await res.json();
      lastError = new Error(`Jupiter token search error (${res.status})`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
