import logger from "../utils/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TokenBalance {
  mint: string;
  amount: string; // raw amount (not adjusted for decimals)
  decimals: number;
}

interface RpcResponse<T> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

// ─── RPC Helper ─────────────────────────────────────────────────────────────

async function rpcCall<T>(method: string, params: any[]): Promise<T> {
  const rpcUrl =
    process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  const json = (await response.json()) as RpcResponse<T>;

  if (json.error) {
    throw new Error(`RPC error: ${json.error.message} (code ${json.error.code})`);
  }

  return json.result as T;
}

// ─── Public Functions ───────────────────────────────────────────────────────

/**
 * Verify that a wallet holds at least the minimum amount of a specific SPL token.
 * Uses Solana JSON-RPC to query token accounts.
 */
export async function verifyTokenHolding(
  walletAddress: string,
  tokenMintAddress: string,
  minimumAmount: string
): Promise<{ qualified: boolean; balance: number; requiredAmount: number }> {
  try {
    const requiredAmount = Number(minimumAmount);
    if (requiredAmount <= 0 || !walletAddress || !tokenMintAddress) {
      return { qualified: true, balance: 0, requiredAmount };
    }

    // Get all token accounts for this wallet
    const accounts = await rpcCall<Array<{
      account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string; decimals: number } } } } };
    }>>("getTokenAccountsByOwner", [
      walletAddress,
      { mint: tokenMintAddress },
      { encoding: "jsonParsed" },
    ]);

    // Sum up balances for the matching mint
    let totalBalance = 0;
    for (const acct of accounts || []) {
      const info = acct?.account?.data?.parsed?.info;
      if (info?.mint === tokenMintAddress) {
        totalBalance += Number(info.tokenAmount?.amount || "0");
      }
    }

    logger.info("Token verification", {
      wallet: walletAddress,
      mint: tokenMintAddress,
      balance: totalBalance,
      required: requiredAmount,
      qualified: totalBalance >= requiredAmount,
    });

    return {
      qualified: totalBalance >= requiredAmount,
      balance: totalBalance,
      requiredAmount,
    };
  } catch (error) {
    logger.error("Token verification failed", {
      wallet: walletAddress,
      mint: tokenMintAddress,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Fail open on RPC errors to prevent blocking subscriptions
    return { qualified: true, balance: 0, requiredAmount: Number(minimumAmount || 0) };
  }
}
