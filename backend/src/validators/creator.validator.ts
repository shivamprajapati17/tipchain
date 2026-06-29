import { z } from "zod";

const usernameRegex = /^[a-zA-Z0-9_-]{2,30}$/;

export const registerCreatorSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(usernameRegex, "Username can only contain letters, numbers, underscores, and hyphens"),
  bio: z.string().max(500).optional().default(""),
  avatarUrl: z.string().url().optional().nullable(),
  socialLinks: z.record(z.string(), z.string()).optional(),
});

export const updateCreatorSchema = z.object({
  username: z
    .string()
    .min(2)
    .max(30)
    .regex(usernameRegex)
    .optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  socialLinks: z.record(z.string(), z.string()).optional(),
});

export const creatorQuerySchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(20),
  sortBy: z.enum(["earnings", "supporters", "newest"]).optional().default("earnings"),
  category: z.string().optional(),
  q: z.string().optional(),
});
