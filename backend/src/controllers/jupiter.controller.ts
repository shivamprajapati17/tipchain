import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { getQuote, getSwapInstructions, searchTokens, getTokenInfo, getAlchemyHealth } from "../services/jupiter.service";

/**
 * GET /api/swap/quote
 * Get a swap quote from Jupiter
 */
export const getSwapQuote = asyncHandler(async (req: Request, res: Response) => {
  const inputMint = String(req.query.inputMint || "");
  const outputMint = String(req.query.outputMint || "");
  const amount = String(req.query.amount || "0");
  const slippageBps = Number(req.query.slippageBps) || 50;

  if (!inputMint || !outputMint || amount === "0") {
    res.status(400).json({
      success: false,
      error: "inputMint, outputMint, and amount are required. amount must be > 0.",
    });
    return;
  }

  const quote = await getQuote(inputMint, outputMint, amount, slippageBps);

  if (!quote) {
    res.status(400).json({
      success: false,
      error: "No route found for this swap pair.",
    });
    return;
  }

  res.json({
    success: true,
    data: {
      quote,
      inputToken: getTokenInfo(inputMint),
      outputToken: getTokenInfo(outputMint),
      priceImpact: Number(quote.priceImpactPct).toFixed(2) + "%",
      routeCount: quote.routePlan?.length || 0,
    },
  });
});

/**
 * POST /api/swap/instructions
 * Get swap transaction instructions for a user
 */
export const getSwapTxInstructions = asyncHandler(async (req: Request, res: Response) => {
  const { quoteResponse, userPublicKey } = req.body;

  if (!quoteResponse || !userPublicKey) {
    res.status(400).json({
      success: false,
      error: "quoteResponse and userPublicKey are required.",
    });
    return;
  }

  const instructions = await getSwapInstructions(quoteResponse, userPublicKey);

  if (!instructions) {
    res.status(500).json({
      success: false,
      error: "Failed to build swap transaction.",
    });
    return;
  }

  res.json({
    success: true,
    data: instructions,
  });
});

/**
 * GET /api/swap/alchemy-health
 * Ping the Alchemy Solana mainnet RPC used by the mainnet swap route.
 */
export const getAlchemyHealthEndpoint = asyncHandler(async (_req: Request, res: Response) => {
  const health = await getAlchemyHealth();
  sendSuccess(res, {
    rpc: health.reachable ? "alchemy-mainnet" : "unreachable",
    reachable: health.reachable,
    blockhash: health.blockhash ?? null,
    slot: health.slot ?? null,
    status: health.status ?? null,
    error: health.error ?? null,
  });
});

/**
 * GET /api/swap/tokens
 * Search for tokens by symbol or name
 */
export const searchTokensEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const query = String(req.query.q || "");

  if (!query || query.length < 1) {
    // Return common tokens if no query
    res.json({
      success: true,
      data: {
        tokens: [
          { address: "So11111111111111111111111111111111111111112", symbol: "SOL", name: "Solana", decimals: 9 },
          { address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", name: "USD Coin", decimals: 6 },
          { address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT", name: "Tether USD", decimals: 6 },
          { address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", symbol: "BONK", name: "Bonk", decimals: 5 },
          { address: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", symbol: "mSOL", name: "Marinade Staked SOL", decimals: 9 },
          { address: "J1toso1uCk3QLmjYXoTpK9sYgdG6E4Vbh15WyoP29M6", symbol: "JitoSOL", name: "Jito Staked SOL", decimals: 9 },
        ],
      },
    });
    return;
  }

  const tokens = await searchTokens(query);
  res.json({ success: true, data: { tokens } });
});
