import logger from "../utils/logger";

// The api.jup.ag gateway (the host the official @jup-ag/cli uses) is reachable
// from datacenter + residential networks when authenticated with an API key,
// so it is tried first everywhere. The classic hosts remain as fallbacks for
// networks where they resolve.
const JUPITER_V1_BASE = "https://api.jup.ag/swap/v1";
const JUPITER_API_BASE = "https://quote-api.jup.ag/v6";
const JUPITER_SWAP_API_BASE = "https://swap-api.jup.ag/v6";
const JUPITER_TOKEN_BASES = [
  "https://api.jup.ag/tokens/v2",
  "https://token.jup.ag",
  "https://token.lite-api.jup.ag",
];
const JUPITER_FETCH_TIMEOUT_MS = 12_000;

// Public Solana mainnet RPC used for the mainnet swap route (execution + health).
const SOLANA_MAINNET_RPC =
  process.env.SOLANA_MAINNET_RPC || "https://solana-rpc.publicnode.com";

// Jupiter's public APIs are friendlier when they see a real client user-agent
// and are sometimes picky about bare Node fetch calls. The API key (env
// JUPITER_API_KEY, free from api.jup.ag) bypasses Cloudflare blocks that can
// affect datacenter IPs (e.g. Render). Jupiter keys are public rate-limit keys,
// so the key below is a safe default fallback for instant datacenter access.
const JUPITER_API_KEY =
  process.env.JUPITER_API_KEY ||
  "jup_57ccc2432485d89da54f7afb148ef9e1601f172c8c9bcd87ace6a36cf318e3ed";

const JUPITER_HEADERS: Record<string, string> = {
  "Accept": "application/json",
  "Content-Type": "application/json",
  "User-Agent": "TipChain/1.0 (creator-economy-platform)",
  "x-api-key": JUPITER_API_KEY,
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
    for (const base of [JUPITER_V1_BASE, JUPITER_API_BASE, JUPITER_SWAP_API_BASE]) {
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
 * Ping the Solana mainnet RPC (getLatestBlockhash) so the frontend can show
 * whether the mainnet swap route is reachable.
 */
export async function getMainnetRpcHealth(): Promise<{
  reachable: boolean;
  blockhash?: string | null;
  slot?: number | null;
  status?: number;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), JUPITER_FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(SOLANA_MAINNET_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getLatestBlockhash",
          params: [{ commitment: "confirmed" }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return { reachable: false, status: response.status };
      }

      const json = (await response.json()) as {
        result?: { value?: { blockhash?: string | null }; context?: { slot?: number | null } };
      };
      return {
        reachable: true,
        blockhash: json?.result?.value?.blockhash ?? null,
        slot: json?.result?.context?.slot ?? null,
      };
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
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
    const body = JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapUnwrapSOL,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    });

    let response: Response | null = null;
    for (const base of [JUPITER_V1_BASE, JUPITER_SWAP_API_BASE, JUPITER_API_BASE]) {
      try {
        response = await jupFetch(`${base}/swap-instructions`, {
          method: "POST",
          body,
        });
        if (response.ok) break;
        logger.warn("Jupiter swap-instructions endpoint non-OK", { base, status: response.status });
      } catch (err) {
        logger.warn("Jupiter swap-instructions endpoint unreachable", {
          base,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    if (!response || !response.ok) {
      logger.error("Jupiter swap instructions error after fallbacks");
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
        const isV2 = base === "https://api.jup.ag/tokens/v2";
        response = await jupFetch(
          isV2
            ? `${base}/search?query=${encodeURIComponent(query)}`
            : `${base}/strict/${encodeURIComponent(query)}`
        );
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

    // Map to a simpler format (v2 search returns {id, icon}, strict returns {address, logoURI})
    return (Array.isArray(tokens) ? tokens : []).map((t: any) => {
      const address = t.address ?? t.id;
      return {
        address,
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        logoURI: t.logoURI ?? t.icon,
        dailyVolume: t.dailyVolume,
        // Mark if it's from our known tokens list
        isKnown: !!KNOWN_TOKENS[address],
      };
    });
  } catch (error) {
    logger.error("Jupiter token search failed", { query });
    return [];
  }
}
