import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  createCreatorSchema,
  updateCreatorSchema,
} from "../lib/validation";

const router = Router();

type CreatorListItem = {
  walletAddress: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  totalTips: bigint;
  supporterCount: number;
  createdAt: Date;
  _count: { tipsReceived: number };
};

type TxSummary = {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  amount: bigint;
  token: string;
  txHash: string | null;
  message: string | null;
  createdAt: Date;
};

type SupporterSummary = {
  id: string;
  walletAddress: string;
  creatorWallet: string;
  totalTipped: bigint;
  tipCount: number;
};

// GET /creators — List all creators
router.get("/creators", async (_req: Request, res: Response) => {
  try {
    const creators = (await prisma.creator.findMany({
      orderBy: { totalTips: "desc" },
      select: {
        walletAddress: true,
        username: true,
        bio: true,
        avatarUrl: true,
        socialLinks: true,
        totalTips: true,
        supporterCount: true,
        createdAt: true,
        _count: {
          select: {
            tipsReceived: true,
          },
        },
      },
    })) as unknown as CreatorListItem[];

    const formatted = creators.map((c) => ({
      walletAddress: c.walletAddress,
      username: c.username,
      bio: c.bio,
      avatarUrl: c.avatarUrl,
      socialLinks: JSON.parse(c.socialLinks || "{}"),
      totalTips: c.totalTips.toString(),
      supporterCount: c.supporterCount,
      transactionCount: c._count.tipsReceived,
      createdAt: c.createdAt,
    }));

    res.json({ creators: formatted });
  } catch (error) {
    console.error("Error fetching creators:", error);
    res.status(500).json({ error: "Failed to fetch creators" });
  }
});

// GET /creator/by-username/:username — Get a single creator by username
router.get("/creator/by-username/:username", async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const creator = await prisma.creator.findUnique({
      where: { username },
      include: {
        tipsReceived: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        supporters: {
          orderBy: { totalTipped: "desc" },
          take: 10,
        },
      },
    });

    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    const tipsReceived = creator.tipsReceived as unknown as TxSummary[];
    const supporters = creator.supporters as unknown as SupporterSummary[];

    res.json({        creator: {
          walletAddress: creator.walletAddress,
          username: creator.username,
          bio: creator.bio,
          avatarUrl: creator.avatarUrl,
          socialLinks: JSON.parse(creator.socialLinks || "{}"),
          totalTips: creator.totalTips.toString(),
          supporterCount: creator.supporterCount,
          createdAt: creator.createdAt,
        },
        recentTransactions: tipsReceived.map((tx: TxSummary) => ({
          id: tx.id,
          senderWallet: tx.senderWallet,
          receiverWallet: tx.receiverWallet,
          amount: tx.amount.toString(),
          token: tx.token,
          txHash: tx.txHash,
          message: tx.message,
          timestamp: tx.createdAt,
        })),
        topSupporters: supporters.map((s: SupporterSummary) => ({
          walletAddress: s.walletAddress,
          totalTipped: s.totalTipped.toString(),
          tipCount: s.tipCount,
        })),
      });
    } catch (error) {
      console.error("Error fetching creator by username:", error);
      res.status(500).json({ error: "Failed to fetch creator" });
    }
  });

// GET /creator/:wallet — Get a single creator by wallet address
router.get("/creator/:wallet", async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;

    const creator = await prisma.creator.findUnique({
      where: { walletAddress: wallet },
      include: {
        tipsReceived: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        supporters: {
          orderBy: { totalTipped: "desc" },
          take: 10,
        },
      },
    });

    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    const tipsReceived = creator.tipsReceived as unknown as TxSummary[];
    const supporters = creator.supporters as unknown as SupporterSummary[];

    res.json({
      creator: {
        walletAddress: creator.walletAddress,
        username: creator.username,
        bio: creator.bio,
        avatarUrl: creator.avatarUrl,
        socialLinks: JSON.parse(creator.socialLinks || "{}"),
        totalTips: creator.totalTips.toString(),
        supporterCount: creator.supporterCount,
        createdAt: creator.createdAt,
      },
      recentTransactions: tipsReceived.map((tx: TxSummary) => ({
        id: tx.id,
        senderWallet: tx.senderWallet,
        receiverWallet: tx.receiverWallet,
        amount: tx.amount.toString(),
        token: tx.token,
        txHash: tx.txHash,
        message: tx.message,
        timestamp: tx.createdAt,
      })),
      topSupporters: supporters.map((s: SupporterSummary) => ({
        walletAddress: s.walletAddress,
        totalTipped: s.totalTipped.toString(),
        tipCount: s.tipCount,
      })),
    });
  } catch (error) {
    console.error("Error fetching creator:", error);
    res.status(500).json({ error: "Failed to fetch creator" });
  }
});

// POST /creator — Create a new creator profile
router.post("/creator", async (req: Request, res: Response) => {
  try {
    const parsed = createCreatorSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { walletAddress, username, bio, avatarUrl } = parsed.data;

    // Check for existing wallet
    const existing = await prisma.creator.findUnique({
      where: { walletAddress },
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Creator with this wallet already exists" });
    }

    // Check for existing username
    const existingUsername = await prisma.creator.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return res
        .status(409)
        .json({ error: "Username already taken" });
    }

    const newCreator = await prisma.creator.create({
      data: {
        walletAddress,
        username,
        bio: bio ?? "",
        avatarUrl: avatarUrl ?? null,
        socialLinks: JSON.stringify(parsed.data.socialLinks || {}),
      },
    });

    res.status(201).json({
      creator: {
        walletAddress: newCreator.walletAddress,
        username: newCreator.username,
        bio: newCreator.bio,
        avatarUrl: newCreator.avatarUrl,
        socialLinks: JSON.parse(newCreator.socialLinks || "{}"),
        totalTips: newCreator.totalTips.toString(),
        supporterCount: newCreator.supporterCount,
        createdAt: newCreator.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating creator:", error);
    res.status(500).json({ error: "Failed to create creator" });
  }
});

// PUT /creator/:wallet — Update a creator profile
router.put("/creator/:wallet", async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const parsed = updateCreatorSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await prisma.creator.findUnique({
      where: { walletAddress: wallet },
    });
    if (!existing) {
      return res.status(404).json({ error: "Creator not found" });
    }

    // If changing username, check it's not taken
    if (parsed.data.username && parsed.data.username !== existing.username) {
      const usernameTaken = await prisma.creator.findUnique({
        where: { username: parsed.data.username },
      });
      if (usernameTaken) {
        return res.status(409).json({ error: "Username already taken" });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.username) updateData.username = parsed.data.username;
    if (parsed.data.bio !== undefined) updateData.bio = parsed.data.bio;
    if (parsed.data.avatarUrl !== undefined) updateData.avatarUrl = parsed.data.avatarUrl;
    if (parsed.data.socialLinks !== undefined) updateData.socialLinks = JSON.stringify(parsed.data.socialLinks);

    const updatedCreator = await prisma.creator.update({
      where: { walletAddress: wallet },
      data: updateData,
    });

    res.json({
      creator: {
        walletAddress: updatedCreator.walletAddress,
        username: updatedCreator.username,
        bio: updatedCreator.bio,
        avatarUrl: updatedCreator.avatarUrl,
        socialLinks: JSON.parse(updatedCreator.socialLinks || "{}"),
        totalTips: updatedCreator.totalTips.toString(),
        supporterCount: updatedCreator.supporterCount,
        createdAt: updatedCreator.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating creator:", error);
    res.status(500).json({ error: "Failed to update creator" });
  }
});

export default router;
