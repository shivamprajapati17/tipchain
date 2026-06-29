import { describe, it, expect } from "vitest";
import {
  generateNonce,
  generateReferralCode,
  generateRequestId,
  hashMessage,
  buildSignMessage,
} from "../../../src/utils/crypto";

describe("generateNonce", () => {
  it("should generate a 64-character hex string", () => {
    const nonce = generateNonce();
    expect(nonce).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(nonce)).toBe(true);
  });

  it("should generate unique nonces each time", () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    expect(nonce1).not.toBe(nonce2);
  });
});

describe("generateReferralCode", () => {
  it("should generate code in format PREFIX-XXXXXX", () => {
    const code = generateReferralCode("shivam");
    expect(code).toMatch(/^SHIV-[A-F0-9]{6}$/);
  });

  it("should use first 4 chars of username in uppercase", () => {
    const code = generateReferralCode("abcdefgh");
    expect(code).toMatch(/^ABCD-/);
  });

  it("should handle short usernames", () => {
    const code = generateReferralCode("ab");
    expect(code).toMatch(/^AB-/);
  });

  it("should generate unique codes for same username", () => {
    const code1 = generateReferralCode("shivam");
    const code2 = generateReferralCode("shivam");
    // The prefix should be same, but the random suffix differs
    expect(code1.startsWith("SHIV-")).toBe(true);
    expect(code2.startsWith("SHIV-")).toBe(true);
    expect(code1).not.toBe(code2);
  });
});

describe("generateRequestId", () => {
  it("should generate request ID with req_ prefix", () => {
    const id = generateRequestId();
    expect(id).toMatch(/^req_[0-9a-f]{32}$/);
  });

  it("should generate unique IDs", () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    expect(id1).not.toBe(id2);
  });
});

describe("hashMessage", () => {
  it("should return SHA-256 hex hash", () => {
    const hash = hashMessage("hello");
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  it("should produce deterministic output", () => {
    const hash1 = hashMessage("test message");
    const hash2 = hashMessage("test message");
    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different inputs", () => {
    const hash1 = hashMessage("message A");
    const hash2 = hashMessage("message B");
    expect(hash1).not.toBe(hash2);
  });
});

describe("buildSignMessage", () => {
  it("should include wallet address and nonce in message", () => {
    const message = buildSignMessage("nonce-123", "wallet-456");
    expect(message).toContain("Wallet: wallet-456");
    expect(message).toContain("Nonce: nonce-123");
  });

  it("should include the platform name", () => {
    const message = buildSignMessage("test", "test");
    expect(message).toContain("TipChain");
  });

  it("should include safety disclaimer", () => {
    const message = buildSignMessage("test", "test");
    expect(message).toContain("not trigger a blockchain transaction");
    expect(message).toContain("cost any fees");
  });

  it("should include a timestamp", () => {
    const message = buildSignMessage("test", "test");
    expect(message).toContain("Timestamp:");
  });

  it("should have consistent structure with newlines", () => {
    const message = buildSignMessage("n", "w");
    const lines = message.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(8);
    expect(lines[0]).toBe("TipChain — Creator Monetization Platform");
  });
});
