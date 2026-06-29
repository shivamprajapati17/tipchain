import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import supertest from "supertest";

vi.mock("../../../src/middleware/auth.middleware", () => ({
  authenticate: vi.fn((_req: any, _res: any, next: any) => {
    _req.user = {
      id: "test-user-id",
      walletAddress: _req.body.creatorWallet || "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd",
      role: "user",
      isAdmin: false,
    };
    next();
  }),
  optionalAuth: vi.fn((_req: any, _res: any, next: any) => next()),
  requireRole: vi.fn(() => (_req: any, _res: any, next: any) => next()),
  requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
}));

vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    creator: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../../src/utils/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { prisma } from "../../../src/lib/prisma";
import { errorHandler } from "../../../src/middleware/error.middleware";
import daoRoutes from "../../../src/routes/dao.routes";

// ─── Test App ───────────────────────────────────────────────────────────────

const WALLET = "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd";
const WALLET_2 = "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r";

const mockCreator = {
  walletAddress: WALLET,
  username: "shivam",
  socialLinks: "{}",
  bio: "Creator",
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(daoRoutes);
  app.use(errorHandler);
  return app;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("DAO Controller (via supertest)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /dao (createDAO)", () => {
    it("should create a DAO with required fields", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const app = createApp();
      const res = await supertest(app)
        .post("/dao")
        .send({ name: "TipChain DAO", creatorWallet: WALLET, treasuryWallet: WALLET });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dao.name).toBe("TipChain DAO");
      expect(res.body.data.dao.members).toHaveLength(1);
      expect(res.body.data.dao.members[0].wallet).toBe(WALLET);
      expect(res.body.data.dao.members[0].role).toBe("admin");
    });

    it("should return 400 when name is missing", async () => {
      const app = createApp();
      const res = await supertest(app)
        .post("/dao")
        .send({ creatorWallet: WALLET, treasuryWallet: WALLET });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("required");
    });

    it("should return 404 when creator does not exist", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      const app = createApp();
      const res = await supertest(app)
        .post("/dao")
        .send({ name: "DAO", creatorWallet: "nonexistent", treasuryWallet: WALLET });

      expect(res.status).toBe(404);
    });

    it("should preserve existing socialLinks when storing DAO", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue({
        ...mockCreator,
        socialLinks: JSON.stringify({ badges: ["gold"] }),
      });
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const app = createApp();
      await supertest(app)
        .post("/dao")
        .send({ name: "New DAO", creatorWallet: WALLET, treasuryWallet: WALLET });

      const updateCall = (prisma.creator.update as any).mock.calls[0][0];
      const updatedLinks = JSON.parse(updateCall.data.socialLinks);
      expect(updatedLinks.badges).toEqual(["gold"]);
      expect(updatedLinks.daos).toHaveLength(1);
    });

    it("should accept custom members and minApprovals", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const app = createApp();
      const res = await supertest(app)
        .post("/dao")
        .send({
          name: "Multi-Sig DAO",
          creatorWallet: WALLET,
          treasuryWallet: WALLET,
          members: [
            { wallet: WALLET, role: "admin", weight: 1 },
            { wallet: WALLET_2, role: "member", weight: 1 },
          ],
          minApprovals: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.dao.members).toHaveLength(2);
      expect(res.body.data.dao.minApprovals).toBe(2);
    });
  });

  describe("GET /dao/:wallet (getDAOs)", () => {
    it("should return DAOs for a creator", async () => {
      const daos = [
        { id: "dao_1", name: "My DAO", creatorWallet: WALLET, treasuryWallet: WALLET,
          members: [{ wallet: WALLET, role: "admin", weight: 1 }],
          minApprovals: 1, totalProposals: 0, totalTipsDistributed: "0", createdAt: new Date().toISOString() },
      ];
      (prisma.creator.findUnique as any).mockResolvedValue({
        ...mockCreator,
        socialLinks: JSON.stringify({ daos }),
      });

      const app = createApp();
      const res = await supertest(app).get(`/dao/${WALLET}`);

      expect(res.status).toBe(200);
      expect(res.body.data.daos).toHaveLength(1);
      expect(res.body.data.daos[0].name).toBe("My DAO");
    });

    it("should return 404 for non-existing creator", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue(null);

      const app = createApp();
      const res = await supertest(app).get("/dao/nonexistent");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /dao/distribute (distributeTip)", () => {
    it("should distribute a tip from DAO treasury", async () => {
      const daoId = "dao_tip_1";
      const daos = [{
        id: daoId, name: "Treasury DAO", creatorWallet: WALLET, treasuryWallet: WALLET,
        members: [{ wallet: WALLET, role: "admin", weight: 1 }],
        minApprovals: 1, totalProposals: 0, totalTipsDistributed: "0", createdAt: new Date().toISOString(),
      }];
      (prisma.creator.findUnique as any).mockResolvedValue({
        ...mockCreator,
        socialLinks: JSON.stringify({ daos }),
      });
      (prisma.transaction.create as any).mockResolvedValue({ id: "tx_1" });
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const app = createApp();
      const res = await supertest(app)
        .post("/dao/distribute")
        .send({ daoId, creatorWallet: WALLET, amount: "1.5" });

      expect(res.status).toBe(200);
      expect(prisma.transaction.create).toHaveBeenCalled();
      expect(prisma.creator.update).toHaveBeenCalled();
    });

    it("should return 400 when fields are missing", async () => {
      const app = createApp();
      const res = await supertest(app)
        .post("/dao/distribute")
        .send({ daoId: "d1" });

      expect(res.status).toBe(400);
    });

    it("should return 404 when DAO not found", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue({
        ...mockCreator,
        socialLinks: JSON.stringify({ daos: [] }),
      });

      const app = createApp();
      const res = await supertest(app)
        .post("/dao/distribute")
        .send({ daoId: "nonexistent", creatorWallet: WALLET, amount: "1" });

      expect(res.status).toBe(404);
    });
  });

  describe("POST /dao/member (addMember)", () => {
    it("should add a new member to DAO", async () => {
      const daoId = "dao_member_1";
      const daos = [{
        id: daoId, name: "Open DAO", creatorWallet: WALLET, treasuryWallet: WALLET,
        members: [{ wallet: WALLET, role: "admin", weight: 1 }],
        minApprovals: 1, totalProposals: 0, totalTipsDistributed: "0", createdAt: new Date().toISOString(),
      }];
      (prisma.creator.findUnique as any).mockResolvedValue({
        ...mockCreator,
        socialLinks: JSON.stringify({ daos }),
      });
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const app = createApp();
      const res = await supertest(app)
        .post("/dao/member")
        .send({ daoId, creatorWallet: WALLET, memberWallet: WALLET_2, role: "member" });

      expect(res.status).toBe(200);
      expect(res.body.data.memberWallet).toBe(WALLET_2);
    });

    it("should return 400 when fields are missing", async () => {
      const app = createApp();
      const res = await supertest(app)
        .post("/dao/member")
        .send({ daoId: "d1" });

      expect(res.status).toBe(400);
    });

    it("should return 404 when DAO not found", async () => {
      (prisma.creator.findUnique as any).mockResolvedValue({
        ...mockCreator,
        socialLinks: JSON.stringify({ daos: [] }),
      });

      const app = createApp();
      const res = await supertest(app)
        .post("/dao/member")
        .send({ daoId: "nonexistent", creatorWallet: WALLET, memberWallet: WALLET_2 });

      expect(res.status).toBe(404);
    });

    it("should return 409 when member already exists", async () => {
      const daoId = "dao_conflict";
      const daos = [{
        id: daoId, name: "Conflict DAO", creatorWallet: WALLET, treasuryWallet: WALLET,
        members: [{ wallet: WALLET, role: "admin", weight: 1 }, { wallet: WALLET_2, role: "member", weight: 1 }],
        minApprovals: 1, totalProposals: 0, totalTipsDistributed: "0", createdAt: new Date().toISOString(),
      }];
      (prisma.creator.findUnique as any).mockResolvedValue({
        ...mockCreator,
        socialLinks: JSON.stringify({ daos }),
      });

      const app = createApp();
      const res = await supertest(app)
        .post("/dao/member")
        .send({ daoId, creatorWallet: WALLET, memberWallet: WALLET_2 });

      expect(res.status).toBe(409);
    });

    it("should default to 'member' role when not specified", async () => {
      const daoId = "dao_default_role";
      const daos = [{
        id: daoId, name: "Default Role DAO", creatorWallet: WALLET, treasuryWallet: WALLET,
        members: [{ wallet: WALLET, role: "admin", weight: 1 }],
        minApprovals: 1, totalProposals: 0, totalTipsDistributed: "0", createdAt: new Date().toISOString(),
      }];
      (prisma.creator.findUnique as any).mockResolvedValue({
        ...mockCreator,
        socialLinks: JSON.stringify({ daos }),
      });
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const app = createApp();
      await supertest(app)
        .post("/dao/member")
        .send({ daoId, creatorWallet: WALLET, memberWallet: WALLET_2 });

      const updateCall = (prisma.creator.update as any).mock.calls[0][0];
      const updatedDaos = JSON.parse(updateCall.data.socialLinks).daos;
      const addedMember = updatedDaos[0].members.find(
        (m: any) => m.wallet === WALLET_2
      );
      expect(addedMember.role).toBe("member");
    });

    it("should accept 'admin' role", async () => {
      const daoId = "dao_admin_role";
      const daos = [{
        id: daoId, name: "Admin Role DAO", creatorWallet: WALLET, treasuryWallet: WALLET,
        members: [{ wallet: WALLET, role: "admin", weight: 1 }],
        minApprovals: 1, totalProposals: 0, totalTipsDistributed: "0", createdAt: new Date().toISOString(),
      }];
      (prisma.creator.findUnique as any).mockResolvedValue({
        ...mockCreator,
        socialLinks: JSON.stringify({ daos }),
      });
      (prisma.creator.update as any).mockResolvedValue(mockCreator);

      const app = createApp();
      await supertest(app)
        .post("/dao/member")
        .send({ daoId, creatorWallet: WALLET, memberWallet: WALLET_2, role: "admin" });

      const updateCall = (prisma.creator.update as any).mock.calls[0][0];
      const updatedDaos = JSON.parse(updateCall.data.socialLinks).daos;
      const addedMember = updatedDaos[0].members.find(
        (m: any) => m.wallet === WALLET_2
      );
      expect(addedMember.role).toBe("admin");
    });
  });
});
