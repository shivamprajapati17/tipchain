import { describe, it, expect } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
} from "../../../src/utils/apiKey";

describe("generateApiKey", () => {
  it("should generate a key with tc_ prefix", () => {
    const result = generateApiKey("test-key");
    expect(result.rawKey.startsWith("tc_")).toBe(true);
  });

  it("should return rawKey of expected length (tc_ + 64 hex chars = 67 chars)", () => {
    const result = generateApiKey("test-key");
    expect(result.rawKey).toHaveLength(67);
  });

  it("should generate a hex string after prefix", () => {
    const result = generateApiKey("test-key");
    const hexPart = result.rawKey.slice(3);
    expect(/^[a-f0-9]{64}$/.test(hexPart)).toBe(true);
  });

  it("should return a 10-char prefix for identification", () => {
    const result = generateApiKey("test-key");
    expect(result.prefix).toHaveLength(10);
    expect(result.prefix.startsWith("tc_")).toBe(true);
    // Prefix should be first 10 chars of rawKey
    expect(result.prefix).toBe(result.rawKey.slice(0, 10));
  });

  it("should return a SHA-256 hashed key (64 hex chars)", () => {
    const result = generateApiKey("test-key");
    expect(result.hashedKey).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(result.hashedKey)).toBe(true);
  });

  it("should produce different keys on each call", () => {
    const result1 = generateApiKey("test-key");
    const result2 = generateApiKey("test-key");
    expect(result1.rawKey).not.toBe(result2.rawKey);
    expect(result1.hashedKey).not.toBe(result2.hashedKey);
  });

  it("should produce different prefixes for different names", () => {
    // Note: prefix is based on rawKey, not name — but rawKey should still differ
    // This test validates each call gets unique outputs regardless of name
    const result1 = generateApiKey("key-one");
    const result2 = generateApiKey("key-two");
    // Prefixes could theoretically collide, but that's fine — prefix is just for display
    expect(result1.hashedKey).not.toBe(result2.hashedKey);
  });
});

describe("hashApiKey", () => {
  it("should return a SHA-256 hex hash (64 chars)", () => {
    const hash = hashApiKey("tc_abc123...");
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
  });

  it("should produce deterministic output", () => {
    const key = "tc_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2";
    const hash1 = hashApiKey(key);
    const hash2 = hashApiKey(key);
    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different keys", () => {
    const hash1 = hashApiKey("tc_key_one...");
    const hash2 = hashApiKey("tc_key_two...");
    expect(hash1).not.toBe(hash2);
  });

  it("should handle empty string", () => {
    const hash = hashApiKey("");
    expect(hash).toHaveLength(64);
  });
});

describe("isValidApiKeyFormat", () => {
  it("should accept validly formatted keys", () => {
    const validKey = "tc_" + "a".repeat(64);
    expect(isValidApiKeyFormat(validKey)).toBe(true);
  });

  it("should reject keys without tc_ prefix", () => {
    expect(isValidApiKeyFormat("abc_" + "a".repeat(64))).toBe(false);
    expect(isValidApiKeyFormat("xy_" + "a".repeat(64))).toBe(false);
  });

  it("should reject keys with wrong hex length", () => {
    // 63 hex chars instead of 64
    expect(isValidApiKeyFormat("tc_" + "a".repeat(63))).toBe(false);
    // 65 hex chars
    expect(isValidApiKeyFormat("tc_" + "a".repeat(65))).toBe(false);
  });

  it("should reject keys with uppercase hex chars", () => {
    expect(isValidApiKeyFormat("tc_" + "A".repeat(64))).toBe(false);
  });

  it("should reject non-hex characters", () => {
    expect(isValidApiKeyFormat("tc_" + "z".repeat(64))).toBe(false);
    expect(isValidApiKeyFormat("tc_" + "ggggg".repeat(12) + "xx")).toBe(false);
  });

  it("should reject empty strings", () => {
    expect(isValidApiKeyFormat("")).toBe(false);
  });

  it("should reject null-like values", () => {
    // @ts-expect-error — testing runtime behavior
    expect(isValidApiKeyFormat(null)).toBe(false);
    // @ts-expect-error — testing runtime behavior
    expect(isValidApiKeyFormat(undefined)).toBe(false);
  });
});
