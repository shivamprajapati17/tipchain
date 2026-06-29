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
  bannerUrl: z.string().url().optional().nullable(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  socialLinks: socialLinksSchema,
  joinMessage: z.string().max(200).optional(),
});

export const updateCreatorSchema = z.object({
  username: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  displayName: z.string().max(50).optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  socialLinks: socialLinksSchema,
  joinMessage: z.string().max(200).optional().nullable(),
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

// ── Social ──────────────────────────────────────────────────────────────────

export const followSchema = z.object({
  followerWallet: z.string().min(32).max(44),
  creatorWallet: z.string().min(32).max(44),
});

export const commentSchema = z.object({
  authorWallet: z.string().min(32).max(44),
  creatorWallet: z.string().min(32).max(44),
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment too long"),
});

export const creatorUpdateSchema = z.object({
  creatorWallet: z.string().min(32).max(44),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  imageUrl: z.string().url().optional().nullable(),
});

export const milestoneSchema = z.object({
  creatorWallet: z.string().min(32).max(44),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  target: z.number().positive().optional(),
});

// ── Memberships ─────────────────────────────────────────────────────────────

export const createMembershipTierSchema = z.object({
  creatorWallet: z.string().min(32).max(44),
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  token: z.enum(["SOL", "USDC"]).default("SOL"),
  benefits: z.array(z.string()).optional(),
  color: z.string().optional(),
  maxSubscribers: z.number().positive().optional(),
});

export const updateMembershipTierSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0).optional(),
  benefits: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  color: z.string().optional(),
});

export const subscribeSchema = z.object({
  tierId: z.string(),
  supporterWallet: z.string().min(32).max(44),
});

// ── Badges ──────────────────────────────────────────────────────────────────

export const awardBadgeSchema = z.object({
  badgeSlug: z.string(),
  walletAddress: z.string().min(32).max(44),
  creatorWallet: z.string().min(32).max(44).optional().nullable(),
  mintAddress: z.string().optional().nullable(),
  metadataUri: z.string().url().optional().nullable(),
});

// ── Referrals ───────────────────────────────────────────────────────────────

export const createReferralSchema = z.object({
  creatorWallet: z.string().min(32).max(44),
});

// ── Notifications ───────────────────────────────────────────────────────────

export const createNotificationSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  type: z.string(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  data: z.record(z.any()).optional(),
});

// ── Categories ──────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

// ── Admin ───────────────────────────────────────────────────────────────────

export const adminVerifySchema = z.object({
  verified: z.boolean(),
});

export const adminFeatureSchema = z.object({
  featured: z.boolean(),
});

// ── Type Exports ────────────────────────────────────────────────────────────

export type CreateCreatorInput = z.infer<typeof createCreatorSchema>;
export type UpdateCreatorInput = z.infer<typeof updateCreatorSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type FollowInput = z.infer<typeof followSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type CreatorUpdateInput = z.infer<typeof creatorUpdateSchema>;
export type MilestoneInput = z.infer<typeof milestoneSchema>;
export type CreateMembershipTierInput = z.infer<typeof createMembershipTierSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type AwardBadgeInput = z.infer<typeof awardBadgeSchema>;
export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
