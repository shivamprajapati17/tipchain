import { z } from "zod";

export const sendTipSchema = z.object({
  senderWallet: z.string().min(32).max(44),
  receiverWallet: z.string().min(32).max(44),
  amount: z.number().positive("Amount must be positive"),
  token: z.enum(["SOL", "USDC"]).default("SOL"),
  txHash: z.string().optional(),
  message: z.string().max(280, "Message too long (max 280 chars)").optional(),
});

export const sendSplTipSchema = z.object({
  senderWallet: z.string().min(32).max(44),
  receiverWallet: z.string().min(32).max(44),
  amount: z.number().positive(),
  tokenMint: z.string().min(1, "Token mint address required"),
  tokenSymbol: z.string().optional().default("SPL"),
  txHash: z.string().optional(),
  message: z.string().max(280).optional(),
});

export const tipHistoryQuerySchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(20),
  token: z.enum(["SOL", "USDC"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const recordTransactionSchema = z.object({
  senderWallet: z.string().min(32).max(44),
  receiverWallet: z.string().min(32).max(44),
  amount: z.number().positive(),
  token: z.enum(["SOL", "USDC"]).default("SOL"),
  txHash: z.string().optional(),
  message: z.string().max(280).optional(),
  slot: z.number().int().positive().optional(),
  block: z.number().int().positive().optional(),
});
