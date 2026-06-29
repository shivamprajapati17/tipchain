import crypto from "crypto";

/**
 * Generate a secure random nonce for wallet authentication
 */
export function generateNonce(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a referral code from a username
 */
export function generateReferralCode(username: string): string {
  const prefix = username.slice(0, 4).toUpperCase();
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${suffix}`;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Hash a wallet message for verification
 */
export function hashMessage(message: string): string {
  return crypto.createHash("sha256").update(message).digest("hex");
}

/**
 * Solana sign-in message template
 */
export function buildSignMessage(nonce: string, walletAddress: string): string {
  return [
    "TipChain — Creator Monetization Platform",
    "",
    "Sign this message to authenticate with TipChain.",
    "",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Timestamp: ${new Date().toISOString()}`,
    "",
    "This signature will not trigger a blockchain transaction or cost any fees.",
  ].join("\n");
}
