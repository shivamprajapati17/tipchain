import { describe, it, expect, vi } from "vitest";
import supertest from "supertest";
import express from "express";

vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    creator: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
    supporter: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

import { prisma } from "../../../src/lib/prisma";
import graphqlRoutes from "../../../src/routes/graphql.routes";

// ─── Test App ───────────────────────────────────────────────────────────────

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(graphqlRoutes);
  return app;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("GraphQL Route (integration via supertest)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/graphql should return 400 when no query provided", async () => {
    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toBe("Must provide a query");
  });

  it("POST /api/graphql should return 400 for non-string query", async () => {
    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({ query: { invalid: true } });

    expect(res.status).toBe(400);
  });

  it("should execute a creator query and return results", async () => {
    const mockCreators = [
      { walletAddress: "wallet1", username: "alice", bio: "Creator Alice" },
      { walletAddress: "wallet2", username: "bob", bio: "Creator Bob" },
    ];
    (prisma.creator.findMany as any).mockResolvedValue(mockCreators);

    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({ query: "creators { walletAddress, username, bio }" });

    expect(res.status).toBe(200);
    expect(res.body.data.creators).toHaveLength(2);
    expect(res.body.data.creators[0].username).toBe("alice");
    expect(res.body.data.creators[0].bio).toBe("Creator Alice");
    // Should not include fields that weren't requested
    expect(res.body.data.creators[0].walletAddress).toBeDefined();
    expect(prisma.creator.findMany).toHaveBeenCalledWith({ take: 20 });
  });

  it("should execute a single creator query with wallet filter", async () => {
    const mockCreator = { walletAddress: "wallet1", username: "alice", bio: "Bio" };
    (prisma.creator.findUnique as any).mockResolvedValue(mockCreator);

    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({
        query: "creator { username, bio }",
        variables: { wallet: "wallet1" },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.creator).toBeDefined();
    expect(res.body.data.creator.username).toBe("alice");
    expect(prisma.creator.findUnique).toHaveBeenCalledWith({
      where: { walletAddress: "wallet1" },
    });
  });

  it("should return null creator when not found", async () => {
    (prisma.creator.findUnique as any).mockResolvedValue(null);

    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({
        query: "creator { username }",
        variables: { wallet: "unknown" },
      });

    expect(res.body.data.creator).toBeNull();
  });

  it("should execute a transactions query", async () => {
    const mockTxs = [
      { id: "tx1", senderWallet: "wallet1", receiverWallet: "wallet2", amount: BigInt(1000000000), token: "SOL", createdAt: new Date() },
    ];
    (prisma.transaction.findMany as any).mockResolvedValue(mockTxs);

    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({ query: "transactions { id, token, amount }" });

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toHaveLength(1);
    expect(res.body.data.transactions[0].token).toBe("SOL");
    // amount should be converted to string
    expect(res.body.data.transactions[0].amount).toBe("1000000000");
  });

  it("should execute a supporters query", async () => {
    const mockSupporters = [
      { walletAddress: "wallet1", totalTipped: BigInt(5000000000), tipCount: 10 },
    ];
    (prisma.supporter.findMany as any).mockResolvedValue(mockSupporters);

    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({ query: "supporters { walletAddress, tipCount }" });

    expect(res.status).toBe(200);
    expect(res.body.data.supporters).toHaveLength(1);
    expect(res.body.data.supporters[0].walletAddress).toBe("wallet1");
    expect(res.body.data.supporters[0].tipCount).toBe(10);
  });

  it("should execute a leaderboard query", async () => {
    const mockLeaderboard = [
      { walletAddress: "wallet1", _sum: { totalTipped: BigInt(10000000000) }, _count: { walletAddress: 5 } },
      { walletAddress: "wallet2", _sum: { totalTipped: BigInt(5000000000) }, _count: { walletAddress: 3 } },
    ];
    (prisma.supporter.groupBy as any).mockResolvedValue(mockLeaderboard);

    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({ query: "leaderboard { rank, walletAddress, totalTipped, tipCount }" });

    expect(res.status).toBe(200);
    expect(res.body.data.leaderboard).toHaveLength(2);
    expect(res.body.data.leaderboard[0].rank).toBe(1);
    expect(res.body.data.leaderboard[0].walletAddress).toBe("wallet1");
    expect(res.body.data.leaderboard[1].totalTipped).toBe("5000000000");
  });

  it("should filter transactions by wallet variable", async () => {
    (prisma.transaction.findMany as any).mockResolvedValue([]);

    const app = createApp();
    await supertest(app)
      .post("/api/graphql")
      .send({
        query: "transactions { id }",
        variables: { wallet: "wallet1" },
      });

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { senderWallet: "wallet1" },
            { receiverWallet: "wallet1" },
          ],
        },
      })
    );
  });

  it("should filter supporters by wallet variable", async () => {
    (prisma.supporter.findMany as any).mockResolvedValue([]);

    const app = createApp();
    await supertest(app)
      .post("/api/graphql")
      .send({
        query: "supporters { walletAddress }",
        variables: { wallet: "wallet_specific" },
      });

    expect(prisma.supporter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { walletAddress: "wallet_specific" },
      })
    );
  });

  it("should handle multiple query types in one request", async () => {
    (prisma.creator.findMany as any).mockResolvedValue([
      { walletAddress: "w1", username: "user1" },
    ]);
    (prisma.transaction.findMany as any).mockResolvedValue([
      { id: "tx1", senderWallet: "w1", receiverWallet: "w2", amount: BigInt(100), token: "SOL", createdAt: new Date() },
    ]);

    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({ query: "creators { username } transactions { id, token }" });

    expect(res.status).toBe(200);
    expect(res.body.data.creators).toHaveLength(1);
    expect(res.body.data.transactions).toHaveLength(1);
  });

  it("should handle GraphQL errors gracefully", async () => {
    (prisma.creator.findMany as any).mockRejectedValue(new Error("DB timeout"));

    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({ query: "creators { username }" });

    expect(res.status).toBe(200); // GraphQL always returns 200
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toBe("DB timeout");
  });

  it("should handle empty query type gracefully", async () => {
    const app = createApp();
    const res = await supertest(app)
      .post("/api/graphql")
      .send({ query: "someUnknownQuery { field }" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });
});
