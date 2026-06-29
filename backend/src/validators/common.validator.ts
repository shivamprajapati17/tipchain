import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const walletParamsSchema = z.object({
  wallet: z.string().min(32, "Invalid wallet address").max(44),
});

export const usernameParamsSchema = z.object({
  username: z.string().min(2).max(30),
});

export const idParamsSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const dateRangeQuerySchema = z.object({
  days: z.coerce.number().positive().max(365).optional().default(30),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
