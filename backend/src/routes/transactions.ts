import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { createTransactionSchema } from "../lib/validation";

const router = Router();

type TxRow = {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  amount: bigint;
  token: string;
  txHash: string | null;
  message: string | null;
  createdAt: Date;
};

// GET /transactions — List all transactions (recent first)
router.get("/transactions", async (_req: Request, res: Response) => {
  try {
    const limit = Math.min(
      Number(_req.query.limit) || 50,
      200
    );

    const transactions = (await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    })) as unknown as TxRow[];

    res.json({
      transactions: transactions.map((tx: TxRow) => ({
        id: tx.id,
        senderWallet: tx.senderWallet,
        receiverWallet: tx.receiverWallet,
        amount: tx.amount.toString(),
        token: tx.token,
        txHash: tx.txHash,
        message: tx.message,
        timestamp: tx.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// GET /transactions/:wallet — Get transactions for a specific wallet
router.get("/transactions/:wallet", async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    const limit = Math.min(
      Number(req.query.limit) || 50,
      200
    );

    const transactions = (await prisma.transaction.findMany({
      where: {
        OR: [{ senderWallet: wallet }, { receiverWallet: wallet }],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })) as unknown as TxRow[];

    res.json({
      wallet,
      transactions: transactions.map((tx: TxRow) => ({
        id: tx.id,
        senderWallet: tx.senderWallet,
        receiverWallet: tx.receiverWallet,
        amount: tx.amount.toString(),
        token: tx.token,
        txHash: tx.txHash,
        message: tx.message,
        timestamp: tx.createdAt,
        direction:
          tx.senderWallet === wallet ? "sent" : "received",
      })),
    });
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// POST /transaction — Record a new transaction
router.post("/transaction", async (req: Request, res: Response) => {
  try {
    const parsed = createTransactionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      senderWallet,
      receiverWallet,
      amount,
      token,
      txHash,
      message,
    } = parsed.data;

    const amountLamports = BigInt(Math.floor(amount * 1e9));

    // Use a transaction to update creator stats + create the tx record
    const transaction = await prisma.$transaction(async (tx: any) => {
      // Upsert supporter record
      const supporter = await tx.supporter.upsert({
        where: {
          walletAddress_creatorWallet: {
            walletAddress: senderWallet,
            creatorWallet: receiverWallet,
          },
        },
        update: {
          totalTipped: { increment: amountLamports },
          tipCount: { increment: 1 },
        },
        create: {
          walletAddress: senderWallet,
          creatorWallet: receiverWallet,
          totalTipped: amountLamports,
          tipCount: 1,
        },
      });

      // Update creator stats
      await tx.creator.upsert({
        where: { walletAddress: receiverWallet },
        update: {
          totalTips: { increment: amountLamports },
          supporterCount: {
            increment: supporter.tipCount === 1 ? 1 : 0,
          },
        },
        create: {
          walletAddress: receiverWallet,
          username: `creator_${receiverWallet.slice(0, 8)}`,
          bio: "",
          totalTips: amountLamports,
          supporterCount: 1,
        },
      });

      // Create transaction record
      return tx.transaction.create({
        data: {
          senderWallet,
          receiverWallet,
          amount: amountLamports,
          token,
          txHash: txHash ?? null,
          message: message ?? null,
        },
      });
    });

    res.status(201).json({
      transaction: {
        id: transaction.id,
        senderWallet: transaction.senderWallet,
        receiverWallet: transaction.receiverWallet,
        amount: transaction.amount.toString(),
        token: transaction.token,
        txHash: transaction.txHash,
        message: transaction.message,
        timestamp: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Error recording transaction:", error);
    res.status(500).json({ error: "Failed to record transaction" });
  }
});

export default router;
