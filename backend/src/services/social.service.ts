import { prisma } from "../lib/prisma";
import { NotFoundError, ConflictError } from "../middleware/error.middleware";
import logger from "../utils/logger";

const SOCIAL_KEY = "_social";
const COMMENTS_KEY = "_comments";
const UPDATES_KEY = "_updates";

interface FollowData {
  followerWallet: string;
  creatorWallet: string;
  createdAt: string;
}

interface CommentData {
  id: string;
  authorWallet: string;
  creatorWallet: string;
  content: string;
  createdAt: string;
}

interface UpdateData {
  id: string;
  creatorWallet: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

class SocialService {
  private getStoredData(creator: any) {
    try {
      const links = JSON.parse(creator.socialLinks || "{}");
      return {
        follows: Array.isArray(links[SOCIAL_KEY]) ? links[SOCIAL_KEY] : [],
        comments: Array.isArray(links[COMMENTS_KEY]) ? links[COMMENTS_KEY] : [],
        updates: Array.isArray(links[UPDATES_KEY]) ? links[UPDATES_KEY] : [],
      };
    } catch {
      return { follows: [], comments: [], updates: [] };
    }
  }

  private async saveData(wallet: string, data: { follows?: any[]; comments?: any[]; updates?: any[] }) {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: wallet } });
    if (!creator) throw new NotFoundError("Creator");

    const existing = this.getStoredData(creator);
    const merged = {
      [SOCIAL_KEY]: data.follows ?? existing.follows,
      [COMMENTS_KEY]: data.comments ?? existing.comments,
      [UPDATES_KEY]: data.updates ?? existing.updates,
    };

    const links = JSON.parse(creator.socialLinks || "{}");
    Object.assign(links, merged);
    await prisma.creator.update({
      where: { walletAddress: wallet },
      data: { socialLinks: JSON.stringify(links) },
    });
  }

  // ─── Follow ────────────────────────────────────────────────────────

  async follow(followerWallet: string, creatorWallet: string): Promise<FollowData> {
    const [follower, creator] = await Promise.all([
      prisma.supporter.findFirst({ where: { walletAddress: followerWallet } }),
      prisma.creator.findUnique({ where: { walletAddress: creatorWallet } }),
    ]);
    if (!creator) throw new NotFoundError("Creator");

    const data = this.getStoredData(creator);
    const existing = data.follows.find((f: FollowData) => f.followerWallet === followerWallet);
    if (existing) throw new ConflictError("Already following this creator");

    const follow: FollowData = {
      followerWallet,
      creatorWallet,
      createdAt: new Date().toISOString(),
    };

    data.follows.push(follow);
    await this.saveData(creatorWallet, { follows: data.follows });
    logger.info("New follow", { follower: followerWallet, creator: creatorWallet });
    return follow;
  }

  async unfollow(followerWallet: string, creatorWallet: string): Promise<void> {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
    if (!creator) throw new NotFoundError("Creator");

    const data = this.getStoredData(creator);
    data.follows = data.follows.filter((f: FollowData) => f.followerWallet !== followerWallet);
    await this.saveData(creatorWallet, { follows: data.follows });
  }

  async getFollowers(creatorWallet: string): Promise<{ followers: FollowData[]; total: number }> {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
    if (!creator) return { followers: [], total: 0 };
    const data = this.getStoredData(creator);
    return { followers: data.follows, total: data.follows.length };
  }

  async getFollowing(wallet: string): Promise<{ following: FollowData[]; total: number }> {
    // Search all creators for follows by this wallet
    const creators = await prisma.creator.findMany();
    const following: FollowData[] = [];
    for (const creator of creators) {
      const data = this.getStoredData(creator);
      const follows = data.follows.filter((f: FollowData) => f.followerWallet === wallet);
      following.push(...follows);
    }
    return { following, total: following.length };
  }

  // ─── Comments ──────────────────────────────────────────────────────

  async addComment(authorWallet: string, creatorWallet: string, content: string): Promise<CommentData> {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
    if (!creator) throw new NotFoundError("Creator");

    const data = this.getStoredData(creator);
    const comment: CommentData = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      authorWallet,
      creatorWallet,
      content,
      createdAt: new Date().toISOString(),
    };
    data.comments.push(comment);
    await this.saveData(creatorWallet, { comments: data.comments });
    return comment;
  }

  async getComments(creatorWallet: string): Promise<CommentData[]> {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
    if (!creator) return [];
    return this.getStoredData(creator).comments.reverse();
  }

  // ─── Updates ───────────────────────────────────────────────────────

  async createUpdate(creatorWallet: string, title: string, content: string, imageUrl?: string): Promise<UpdateData> {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
    if (!creator) throw new NotFoundError("Creator");

    const data = this.getStoredData(creator);
    const update: UpdateData = {
      id: `upd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      creatorWallet,
      title,
      content,
      imageUrl,
      createdAt: new Date().toISOString(),
    };
    data.updates.push(update);
    await this.saveData(creatorWallet, { updates: data.updates });
    return update;
  }

  async getUpdates(creatorWallet: string): Promise<UpdateData[]> {
    const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
    if (!creator) return [];
    return this.getStoredData(creator).updates.reverse();
  }

  async getFeed(wallet: string): Promise<UpdateData[]> {
    const following = await this.getFollowing(wallet);
    const walletSet = new Set(following.following.map((f) => f.creatorWallet));
    walletSet.add(wallet); // Include own updates

    const allUpdates: UpdateData[] = [];
    const creators = await prisma.creator.findMany();
    for (const creator of creators) {
      if (walletSet.has(creator.walletAddress)) {
        const data = this.getStoredData(creator);
        allUpdates.push(...data.updates);
      }
    }

    return allUpdates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
  }
}

export const socialService = new SocialService();
