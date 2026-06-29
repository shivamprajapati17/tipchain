import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { AuthService } from "../../../src/services/auth.service";

// Mock dependencies
vi.mock("../../../src/repositories/user.repository", () => ({
  userRepository: {
    upsert: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("../../../src/utils/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { userRepository } from "../../../src/repositories/user.repository";
import { UnauthorizedError } from "../../../src/middleware/error.middleware";
import { UserRole } from "../../../src/types/auth.types";

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe("requestNonce", () => {
    it("should generate a nonce for a wallet address", async () => {
      const walletAddress = "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd";

      const result = await authService.requestNonce(walletAddress);

      expect(result).toHaveProperty("nonce");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("expiresAt");
      expect(typeof result.nonce).toBe("string");
      expect(result.nonce.length).toBeGreaterThan(20);
      expect(result.message).toContain(walletAddress);
      expect(result.message).toContain(result.nonce);
    });

    it("should generate a valid ISO date for expiresAt", async () => {
      const result = await authService.requestNonce("test-wallet");
      const expiresAt = new Date(result.expiresAt);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(expiresAt.getTime()).toBeLessThan(Date.now() + 10 * 60 * 1000); // Max 10 min
    });
  });

  describe("generateTokens", () => {
    it("should generate access and refresh tokens", () => {
      const tokens = authService.generateTokens(
        "user-id-123",
        "wallet-address",
        UserRole.SUPPORTER
      );

      expect(tokens).toHaveProperty("accessToken");
      expect(tokens).toHaveProperty("refreshToken");
      expect(tokens).toHaveProperty("expiresIn");
      expect(typeof tokens.accessToken).toBe("string");
      expect(typeof tokens.refreshToken).toBe("string");
      expect(tokens.expiresIn).toBe(900); // 15 minutes

      // Verify access token decodes correctly
      const decoded = jwt.decode(tokens.accessToken) as any;
      expect(decoded.sub).toBe("user-id-123");
      expect(decoded.wallet).toBe("wallet-address");
      expect(decoded.role).toBe(UserRole.SUPPORTER);
    });

    it("should generate admin role tokens", () => {
      const tokens = authService.generateTokens("id", "wallet", UserRole.ADMIN);

      const decoded = jwt.decode(tokens.accessToken) as any;
      expect(decoded.role).toBe(UserRole.ADMIN);
    });

    it("should return correct expiresIn (15m = 900s from test env)", () => {
      const tokens = authService.generateTokens("id", "wallet", UserRole.SUPPORTER);
      expect(tokens.expiresIn).toBe(900);
    });
  });

  describe("verifySignature", () => {
    it("should throw UnauthorizedError for missing nonce", async () => {
      await expect(
        authService.verifySignature("test-wallet", "sig", "nonce")
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError for invalid nonce", async () => {
      // Request a nonce first
      await authService.requestNonce("test-wallet");

      // Try with wrong nonce
      await expect(
        authService.verifySignature("test-wallet", "sig", "wrong-nonce")
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should upsert user and return tokens for valid signature", async () => {
      const mockUser = { id: "user-id", walletAddress: "test-wallet" };
      (userRepository.upsert as any).mockResolvedValue(mockUser);

      // Request nonce
      const { nonce } = await authService.requestNonce("test-wallet");

      // Verify with correct nonce
      const tokens = await authService.verifySignature("test-wallet", "valid-sig", nonce);

      expect(tokens).toHaveProperty("accessToken");
      expect(tokens).toHaveProperty("refreshToken");
      expect(userRepository.upsert).toHaveBeenCalledWith("test-wallet");
    });
  });

  describe("refreshAccessToken", () => {
    it("should throw for invalid refresh token", async () => {
      await expect(
        authService.refreshAccessToken("invalid-token")
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("parseExpiry", () => {
    it("should parse days correctly", () => {
      const result = (authService as any).parseExpiry("7d");
      expect(result).toBe(604800);
    });

    it("should parse hours correctly", () => {
      const result = (authService as any).parseExpiry("24h");
      expect(result).toBe(86400);
    });

    it("should parse minutes correctly", () => {
      const result = (authService as any).parseExpiry("30m");
      expect(result).toBe(1800);
    });

    it("should parse seconds correctly", () => {
      const result = (authService as any).parseExpiry("60s");
      expect(result).toBe(60);
    });

    it("should return default for invalid format", () => {
      const result = (authService as any).parseExpiry("invalid");
      expect(result).toBe(604800);
    });
  });
});
