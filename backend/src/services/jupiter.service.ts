import logger from "../utils/logger";

const JUPITER_API_BASE = "https://quote-api.jup.ag/v6";
const JUPITER_SWAP_API_BASE = "https://swap-api.jup.ag/v6";
const JUPITER_LITE_API_BASE = "https://lite-api.jup.ag/v6";
const JUPITER_TOKEN_BASES = ["https://token.jup.ag", "https://token.lite-api.jup.ag"];
const JUPITER_FETCH_TIMEOUT_MS = 12_000;

// Jupiter's public APIs are friendlier when they see a real client user-agent
// and are sometimes picky about bare Node fetch calls.
const JUPITER_HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json",
  "User-Agent": "TipChain/1.0 (creator-economy-platform)",
};

/**
 * fetch with an AbortSignal timeout so a slow/blocked Jupiter call fails fast
 * instead of hanging the API route.
 */
async function jupFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JUPITER_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      headers: { ...JUPITER_HEADERS, ...(init?.headers ?? {}) },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  platformFee: string | null;
  contextSlot: number;
  timeTaken: number;
}

export interface SwapInstructions {
  tokenLedgerInstruction: any;
  computeBudgetInstructions: any[];
  setupInstructions: any[];
  swapInstruction: any;
  cleanupInstruction: any;
  addressLookupTableAddresses: string[];
}

// ─── Token Info Map (common tokens) ─────────────────────────────────────────

const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number; logo?: string }> = {
  "So11111111111111111111111111111111111111112": {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": {
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
  },
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": {
    symbol: "mSOL",
    name: "Marinade Staked SOL",
    decimals: 9,
  },
  "J1toso1uCk3QLmjYXoTpK9sYgdG6E4Vbh15WyoP29M6": {
    symbol: "JitoSOL",
    name: "Jito Staked SOL",
    decimals: 9,
  },
};

// ─── Public Functions ───────────────────────────────────────────────────────

/**
 * Get a quote for swapping one token to another via Jupiter.
 */
export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: string, // raw amount (not adjusted for decimals)
  slippageBps: number = 50 // 0.5% default slippage
): Promise<SwapQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps: String(slippageBps),
      onlyDirectRoutes: "false",
      asLegacyTransaction: "false",
    });

    // Primary: quote-api.jup.ag. Fallbacks: swap-api.jup.ag, then lite-api.jup.ag
    // (lite-api is designed to be permissive for server-side use).
    let response: Response | null = null;
    for (const base of [JUPITER_API_BASE, JUPITER_SWAP_API_BASE, JUPITER_LITE_API_BASE]) {
      try {
        response = await jupFetch(`${base}/quote?${params}`);
        if (response.ok) break;
        logger.warn("Jupiter quote endpoint responded non-OK", { base, status: response.status });
      } catch (err) {
        logger.warn("Jupiter quote endpoint unreachable", {
          base,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    if (!response || !response.ok) {
      logger.error("Jupiter quote error after fallbacks");
      return null;
    }

    const quote = (await response.json()) as SwapQuote;

    logger.info("Jupiter quote received", {
      in: inputMint.slice(0, 8),
      out: outputMint.slice(0, 8),
      amount,
      routes: quote.routePlan?.length || 0,
    });

    return quote;
  } catch (error) {
    logger.error("Jupiter quote failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Get swap transaction instructions from Jupiter.
 * Requires a quote response.
 */
export async function getSwapInstructions(
  quoteResponse: SwapQuote,
  userPublicKey: string,
  wrapUnwrapSOL: boolean = true
): Promise<SwapInstructions | null> {
  try {
    const response = await jupFetch(`${JUPITER_SWAP_API_BASE}/swap-instructions`, {
      method: "POST",
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapUnwrapSOL,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error("Jupiter swap instructions error", { status: response.status, body: text });
      return null;
    }

    const instructions = (await response.json()) as SwapInstructions;
    return instructions;
  } catch (error) {
    logger.error("Jupiter swap instructions failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Get token info for a given mint address.
 */
export function getTokenInfo(mintAddress: string) {
  return KNOWN_TOKENS[mintAddress] || null;
}

/**
 * Search for a token by symbol or name (case-insensitive partial match).
 */
export async function searchTokens(query: string) {
  try {
    let response: Response | null = null;
    for (const base of JUPITER_TOKEN_BASES) {
      try {
        response = await jupFetch(`${base}/strict/${encodeURIComponent(query)}`);
        if (response.ok) break;
      } catch (err) {
        logger.warn("Jupiter token base unreachable", {
          base,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    if (!response || !response.ok) return [];

    const tokens = await response.json();

    // Map to a simpler format
    return (Array.isArray(tokens) ? tokens : []).map((t: any) => ({
      address: t.address,
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals,
      logoURI: t.logoURI,
      dailyVolume: t.dailyVolume,
      // Mark if it's from our known tokens list
      isKnown: !!KNOWN_TOKENS[t.address],
    }));
  } catch (error) {
    logger.error("Jupiter token search failed", { query });
    return [];
  }
}
