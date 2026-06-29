export enum UserRole {
  SUPPORTER = "supporter",
  CREATOR = "creator",
  MODERATOR = "moderator",
  ADMIN = "admin",
}

export interface JwtPayload {
  sub: string; // user id
  wallet: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // token ID for revocation
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface WalletSignInRequest {
  walletAddress: string;
  signature: string;
  message: string;
  publicKey?: string;
}

export interface NonceResponse {
  nonce: string;
  message: string;
  expiresAt: string;
}
