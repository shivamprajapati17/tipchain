import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated, sendDeleted } from "../utils/apiResponse";
import { prisma } from "../lib/prisma";
import { AppError, NotFoundError } from "../middleware/error.middleware";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DAO {
  id: string;
  name: string;
  description: string;
  creatorWallet: string;
  treasuryWallet: string;
  members: Array<{ wallet: string; role: "admin" | "member"; weight: number }>;
  minApprovals: number;
  totalProposals: number;
  totalTipsDistributed: string;
  createdAt: string;
}

// ─── Controller ─────────────────────────────────────────────────────────────

export const createDAO = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, creatorWallet, treasuryWallet, members, minApprovals } = req.body;

  if (!name || !creatorWallet || !treasuryWallet) {
    res.status(400).json({ success: false, error: "name, creatorWallet, and treasuryWallet are required" });
    return;
  }

  // Check if creator exists
  const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
  if (!creator) throw new NotFoundError("Creator");

  // Build the DAO object stored in socialLinks metadata
  const daoData = JSON.parse(creator.socialLinks || "{}");
  const daos = Array.isArray(daoData.daos) ? daoData.daos : [];

  const dao: DAO = {
    id: `dao_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    description: description || "",
    creatorWallet,
    treasuryWallet: treasuryWallet || creatorWallet,
    members: members || [{ wallet: creatorWallet, role: "admin", weight: 1 }],
    minApprovals: minApprovals || 1,
    totalProposals: 0,
    totalTipsDistributed: "0",
    createdAt: new Date().toISOString(),
  };

  daos.push(dao);
  daoData.daos = daos;

  await prisma.creator.update({
    where: { walletAddress: creatorWallet },
    data: { socialLinks: JSON.stringify(daoData) },
  });

  sendCreated(res, { dao });
});

export const getDAOs = asyncHandler(async (req: Request, res: Response) => {
  const wallet = String(req.params.wallet);
  const creator = await prisma.creator.findUnique({ where: { walletAddress: wallet } });
  if (!creator) throw new NotFoundError("Creator");

  const daoData = JSON.parse(creator.socialLinks || "{}");
  const daos = (Array.isArray(daoData.daos) ? daoData.daos : []).filter(
    (d: DAO) => d.creatorWallet === wallet || d.members?.some((m: any) => m.wallet === wallet)
  );

  sendSuccess(res, { wallet, daos });
});

export const distributeTip = asyncHandler(async (req: Request, res: Response) => {
  const { daoId, creatorWallet, amount, token, memo } = req.body;

  if (!daoId || !creatorWallet || !amount) {
    res.status(400).json({ success: false, error: "daoId, creatorWallet, and amount are required" });
    return;
  }

  const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
  if (!creator) throw new NotFoundError("Creator");

  const daoData = JSON.parse(creator.socialLinks || "{}");
  const daos: DAO[] = Array.isArray(daoData.daos) ? daoData.daos : [];
  const dao = daos.find((d: DAO) => d.id === daoId);

  if (!dao) {
    res.status(404).json({ success: false, error: "DAO not found" });
    return;
  }

  // Record the distribution as a transaction
  const amountBigInt = BigInt(Math.floor(Number(amount) * 1e9));

  await prisma.transaction.create({
    data: {
      senderWallet: dao.treasuryWallet,
      receiverWallet: creatorWallet,
      amount: amountBigInt,
      token: token || "SOL",
      txHash: null,
      message: memo || `DAO distribution: ${dao.name}`,
    },
  });

  // Update total distributed
  dao.totalTipsDistributed = (BigInt(dao.totalTipsDistributed || "0") + amountBigInt).toString();

  // Save back
  daoData.daos = daos;
  await prisma.creator.update({
    where: { walletAddress: creatorWallet },
    data: { socialLinks: JSON.stringify(daoData) },
  });

  sendSuccess(res, { dao, amount: amountBigInt.toString() }, "DAO distribution sent");
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { daoId, creatorWallet, memberWallet, role } = req.body;

  if (!daoId || !creatorWallet || !memberWallet) {
    res.status(400).json({ success: false, error: "daoId, creatorWallet, and memberWallet are required" });
    return;
  }

  const creator = await prisma.creator.findUnique({ where: { walletAddress: creatorWallet } });
  if (!creator) throw new NotFoundError("Creator");

  const daoData = JSON.parse(creator.socialLinks || "{}");
  const daos: DAO[] = Array.isArray(daoData.daos) ? daoData.daos : [];
  const dao = daos.find((d: DAO) => d.id === daoId);

  if (!dao) {
    res.status(404).json({ success: false, error: "DAO not found" });
    return;
  }

  if (dao.members.some((m) => m.wallet === memberWallet)) {
    res.status(409).json({ success: false, error: "Member already exists in DAO" });
    return;
  }

  dao.members.push({
    wallet: memberWallet,
    role: role === "admin" ? "admin" : "member",
    weight: 1,
  });

  daoData.daos = daos;
  await prisma.creator.update({
    where: { walletAddress: creatorWallet },
    data: { socialLinks: JSON.stringify(daoData) },
  });

  sendSuccess(res, { daoId, memberWallet, role: role || "member" }, "Member added to DAO");
});
