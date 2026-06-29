import logger from "../utils/logger";

const JUPITER_API_BASE = "https://quote-api.jup.ag/v6";

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

    const response = await fetch(`${JUPITER_API_BASE}/quote?${params}`, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error("Jupiter quote error", { status: response.status, body: text });
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
    const response = await fetch(`${JUPITER_API_BASE}/swap-instructions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const response = await fetch(
      `https://token.jup.ag/strict/${encodeURIComponent(query)}`,
      { headers: { "Accept": "application/json" } }
    );

    if (!response.ok) return [];

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
