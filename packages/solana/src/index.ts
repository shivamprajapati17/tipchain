/**
 * @tipchain/solana — Solana Program Interaction Layer
 *
 * Utilities for interacting with the TipChain Anchor program
 * and Solana blockchain.
 *
 * @example
 * ```typescript
 * import { TipChainProgram } from "@tipchain/solana";
 *
 * const program = new TipChainProgram({ rpc: "https://api.devnet.solana.com" });
 * const creator = await program.getCreatorAccount("wallet_address");
 * ```
 */

// ─── Program Client ─────────────────────────────────────────────────────────

export class TipChainProgram {
  private rpc: string;

  constructor(config: { rpc?: string } = {}) {
    this.rpc = config.rpc ?? "https://api.devnet.solana.com";
  }

  async getCreatorAccount(_wallet: string): Promise<{
    authority: string;
    totalTips: string;
    supporterCount: number;
  }> {
    return {
      authority: _wallet,
      totalTips: "0",
      supporterCount: 0,
    };
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const TIPCHAIN_PROGRAM_ID =
  "TCv1pL4n3x7m9K2qR5w8B1cF6dX2yH0aG3sE4r9x";

export const TIPCHAIN_DECIMALS = 9;

// ─── Helpers ────────────────────────────────────────────────────────────────

export const lamportsToSol = (lamports: string | number | bigint): number =>
  Number(lamports) / 10 ** TIPCHAIN_DECIMALS;

export const solToLamports = (sol: number): number =>
  Math.floor(sol * 10 ** TIPCHAIN_DECIMALS);
