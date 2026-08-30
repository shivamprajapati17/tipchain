import { z } from "zod";

const socialLinkRegex = /^(https?:\/\/)?([\w.-]+\.)+[\w.-]+(\/[\w\-./?%&=]*)?$/i;

const socialLinksSchema = z.record(
  z.string(),
  z.string().regex(socialLinkRegex, "Invalid URL").or(z.literal(""))
).optional();

// ── Creator ─────────────────────────────────────────────────────────────────

export const createCreatorSchema = z.object({
  walletAddress: z.string().min(32, "Invalid wallet address").max(44),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
  avatarUrl: z.string().url("Invalid URL").optional().nullable(),
  displayName: z.string().max(50).optional(),
  socialLinks: socialLinksSchema,
});

export const updateCreatorSchema = z.object({
  username: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  displayName: z.string().max(50).optional(),
  socialLinks: socialLinksSchema,
});

// ── Transaction ─────────────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  senderWallet: z.string().min(32).max(44),
  receiverWallet: z.string().min(32).max(44),
  amount: z.number().positive("Amount must be positive"),
  token: z.enum(["SOL", "USDC"]).default("SOL"),
  txHash: z.string().optional(),
  message: z.string().max(280).optional(),
});

// ── Supporter ───────────────────────────────────────────────────────────────

export const updateSupporterSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type CreateCreatorInput = z.infer<typeof createCreatorSchema>;
export type UpdateCreatorInput = z.infer<typeof updateCreatorSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
