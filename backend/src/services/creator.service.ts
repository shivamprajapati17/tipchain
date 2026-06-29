import { prisma } from "../lib/prisma";
import { creatorRepository } from "../repositories/creator.repository";
import { userRepository } from "../repositories/user.repository";
import { ConflictError, NotFoundError } from "../middleware/error.middleware";
import { cacheGet, cacheSet, cacheDelPattern } from "../lib/redis";

export class CreatorService {
  async getByWallet(wallet: string) {
    const cacheKey = `creator:wallet:${wallet}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

    const creator = await creatorRepository.findByWallet(wallet);
    if (!creator) throw new NotFoundError("Creator");

    const result = this.formatCreator(creator);
    await cacheSet(cacheKey, result, 120);
    return result;
  }

  async getByUsername(username: string) {
    const cacheKey = `creator:username:${username}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

    const creator = await creatorRepository.findByUsername(username);
    if (!creator) throw new NotFoundError("Creator");

    const result = this.formatCreator(creator);
    await cacheSet(cacheKey, result, 120);
    return result;
  }

  async list(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    category?: string;
  }) {
    const { page = 1, limit = 20, sortBy = "earnings", category } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) where.socialLinks = { contains: category };

    let orderBy: any = { totalTips: "desc" };
    if (sortBy === "supporters") orderBy = { supporterCount: "desc" };
    if (sortBy === "newest") orderBy = { createdAt: "desc" };

    const { creators, total } = await creatorRepository.findMany({ skip, take: limit, orderBy, where });

    return {
      creators: creators.map((c: any) => this.formatCreator(c)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async register(data: {
    walletAddress: string;
    username: string;
    bio?: string;
    avatarUrl?: string | null;
    socialLinks?: Record<string, string>;
  }) {
    const existing = await creatorRepository.findByWallet(data.walletAddress);
    if (existing) throw new ConflictError("Creator with this wallet already exists");

    const existingUsername = await creatorRepository.findByUsername(data.username);
    if (existingUsername) throw new ConflictError("Username already taken");

    await userRepository.upsert(data.walletAddress);

    const creator = await creatorRepository.create({
      walletAddress: data.walletAddress,
      username: data.username,
      bio: data.bio ?? "",
      avatarUrl: data.avatarUrl ?? null,
      socialLinks: JSON.stringify(data.socialLinks ?? {}),
    });

    await cacheDelPattern(`creator:*`);
    return this.formatCreator(creator);
  }

  async update(wallet: string, data: any) {
    const existing = await creatorRepository.findByWallet(wallet);
    if (!existing) throw new NotFoundError("Creator");

    if (data.username && data.username !== existing.username) {
      const taken = await creatorRepository.findByUsername(data.username);
      if (taken) throw new ConflictError("Username already taken");
    }

    const updateData: any = {};
    if (data.username !== undefined) updateData.username = data.username;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.socialLinks !== undefined) updateData.socialLinks = JSON.stringify(data.socialLinks);

    const creator = await creatorRepository.update(wallet, updateData);
    await cacheDelPattern(`creator:*`);
    return this.formatCreator(creator);
  }

  async delete(wallet: string) {
    const existing = await creatorRepository.findByWallet(wallet);
    if (!existing) throw new NotFoundError("Creator");
    await creatorRepository.delete(wallet);
    await cacheDelPattern(`creator:*`);
  }

  async getDashboard(wallet: string) {
    const dashboard = await creatorRepository.getMyDashboard(wallet);
    if (!dashboard) throw new NotFoundError("Creator profile not found");
    return dashboard;
  }

  async search(query: string, params: {
    page?: number;
    limit?: number;
    category?: string;
    sortBy?: string;
  }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const { creators, total } = await creatorRepository.search(query, {
      skip,
      take: limit,
      category: params.category,
      sortBy: params.sortBy,
    });

    return {
      creators: creators.map((c: any) => this.formatCreator(c)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTrending(limit = 20) {
    const trending = await creatorRepository.getTrending(limit);
    return trending.map((item: any) => ({
      ...this.formatCreator({
        walletAddress: item.walletAddress,
        username: item.username,
        bio: item.bio,
        avatarUrl: item.avatarUrl,
        socialLinks: item.socialLinks,
        totalTips: item.totalTips,
        supporterCount: item.supporterCount,
        createdAt: item.createdAt,
      }),
      recentVolume: item.recentVolume,
      recentTips: item.recentTips,
    }));
  }

  async getFeatured(limit = 10) {
    const { creators } = await creatorRepository.findMany({
      take: limit,
      orderBy: { totalTips: "desc" },
    });
    return creators.map((c: any) => this.formatCreator(c));
  }

  async getRecent(limit = 10) {
    const { creators } = await creatorRepository.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    return creators.map((c: any) => this.formatCreator(c));
  }

  async getRecommended(_wallet?: string, limit = 10) {
    // No Follow model exists, so just return top creators
    const { creators } = await creatorRepository.findMany({
      take: limit,
      orderBy: { totalTips: "desc" },
    });
    return creators.map((c: any) => this.formatCreator(c));
  }

  private formatCreator(creator: any) {
    return {
      walletAddress: creator.walletAddress,
      username: creator.username,
      displayName: creator.username,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl ?? null,
      bannerUrl: null,
      socialLinks: typeof creator.socialLinks === "string"
        ? JSON.parse(creator.socialLinks || "{}")
        : creator.socialLinks ?? {},
      category: null,
      tags: [],
      featured: false,
      verified: false,
      totalTips: creator.totalTips?.toString() ?? "0",
      supporterCount: creator.supporterCount ?? 0,
      followerCount: 0,
      joinMessage: null,
      createdAt: creator.createdAt?.toISOString?.() ?? creator.createdAt,
    };
  }
}

export const creatorService = new CreatorService();
