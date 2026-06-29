import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getEnv } from "../config/env";
import { JwtPayload, AuthTokens, UserRole } from "../types/auth.types";
import { userRepository } from "../repositories/user.repository";
import { UnauthorizedError } from "../middleware/error.middleware";
import { buildSignMessage } from "../utils/crypto";
import logger from "../utils/logger";

// In-memory nonce store (in production, use Redis)
const nonceStore = new Map<string, { nonce: string; expiresAt: Date }>();

const ADMIN_WALLETS = (process.env.TIPCHAIN_ADMIN_WALLETS || "").split(",").map((w: string) => w.trim()).filter(Boolean);

export class AuthService {
  async requestNonce(walletAddress: string): Promise<{ nonce: string; message: string; expiresAt: string }> {
    const nonce = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    nonceStore.set(walletAddress, { nonce, expiresAt });

    const message = buildSignMessage(nonce, walletAddress);

    return {
      nonce,
      message,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async verifySignature(walletAddress: string, _signature: string, nonce: string): Promise<AuthTokens> {
    const stored = nonceStore.get(walletAddress);
    if (!stored) {
      throw new UnauthorizedError("No sign-in request found. Please request a new nonce.");
    }

    if (stored.nonce !== nonce) {
      throw new UnauthorizedError("Invalid nonce. Please request a new one.");
    }

    if (new Date() > stored.expiresAt) {
      nonceStore.delete(walletAddress);
      throw new UnauthorizedError("Nonce expired. Please request a new one.");
    }

    nonceStore.delete(walletAddress);

    // Upsert user (using Creator model as user profile)
    const user = await userRepository.upsert(walletAddress);

    const role = ADMIN_WALLETS.includes(walletAddress) ? UserRole.ADMIN : UserRole.SUPPORTER;
    const tokens = this.generateTokens(user.id, walletAddress, role);

    logger.info(`Wallet signed in: ${walletAddress.slice(0, 8)}...`);

    return tokens;
  }

  generateTokens(userId: string, walletAddress: string, role: UserRole): AuthTokens {
    const env = getEnv();

    const accessToken = jwt.sign(
      { sub: userId, wallet: walletAddress, role } as jwt.JwtPayload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { sub: userId, jti: crypto.randomUUID() },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );

    const expiresIn = this.parseExpiry(env.JWT_EXPIRES_IN);

    return { accessToken, refreshToken, expiresIn };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const env = getEnv();
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;

      const user = await userRepository.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      const role = ADMIN_WALLETS.includes(user.walletAddress) ? UserRole.ADMIN : UserRole.SUPPORTER;
      return this.generateTokens(user.id, user.walletAddress, role);
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([dhms])$/);
    if (!match) return 604800;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "d": return value * 86400;
      case "h": return value * 3600;
      case "m": return value * 60;
      case "s": return value;
      default: return 604800;
    }
  }
}

export const authService = new AuthService();
