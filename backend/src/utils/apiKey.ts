import crypto from "crypto";

const KEY_PREFIX = "tc_";
const KEY_BYTES = 32;

/**
 * Generate a new API key with a unique prefix for identification.
 * Returns the full key (shown once) and a hashed version for storage.
 */
export function generateApiKey(name: string): {
  rawKey: string;
  prefix: string;
  hashedKey: string;
} {
  const randomBytes = crypto.randomBytes(KEY_BYTES);
  const rawKey = `${KEY_PREFIX}${randomBytes.toString("hex")}`;
  const prefix = rawKey.slice(0, 10); // "tc_<first 6 hex chars>"
  const hashedKey = hashApiKey(rawKey);

  return { rawKey, prefix, hashedKey };
}

/**
 * Hash an API key for secure storage.
 * We use SHA-256 so we never store the raw key.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^tc_[a-f0-9]{64}$/.test(key);
}
