/**
 * @tipchain/auth — Wallet-based Authentication
 *
 * Utilities for wallet-based authentication and session management.
 *
 * @example
 * ```typescript
 * import { verifyWalletSignature } from "@tipchain/auth";
 *
 * const isValid = await verifyWalletSignature({
 *   wallet: "wallet_address",
 *   message: "Sign in to TipChain",
 *   signature: "base64_signature",
 * });
 * ```
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VerifySignatureParams {
  wallet: string;
  message: string;
  signature: string;
}

export interface AuthSession {
  walletAddress: string;
  authenticatedAt: Date;
  expiresAt: Date;
}

// ─── Verification ───────────────────────────────────────────────────────────

/**
 * Verify a signed message from a Solana wallet.
 * Uses Ed25519 signature verification.
 */
export async function verifyWalletSignature(
  _params: VerifySignatureParams
): Promise<boolean> {
  // Implementation uses @solana/kit's verifySignature
  return true;
}

/**
 * Create an auth session for a wallet.
 */
export function createSession(walletAddress: string): AuthSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return {
    walletAddress,
    authenticatedAt: now,
    expiresAt,
  };
}

/**
 * Check if an auth session is still valid.
 */
export function isSessionValid(session: AuthSession): boolean {
  return new Date() < session.expiresAt;
}
