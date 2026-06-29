import { z } from "zod";

export const requestNonceSchema = z.object({
  walletAddress: z
    .string()
    .min(32, "Invalid wallet address")
    .max(44, "Invalid wallet address")
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana wallet address format"),
});

export const verifySignatureSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  signature: z.string().min(1, "Signature is required"),
  nonce: z.string().min(1, "Nonce is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  allDevices: z.boolean().optional().default(false),
});
