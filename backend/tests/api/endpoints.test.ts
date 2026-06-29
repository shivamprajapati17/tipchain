import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import supertest from "supertest";
import { errorHandler } from "../../src/middleware/error.middleware";

// Mock Prisma BEFORE importing routes
vi.mock("../../src/lib/prisma", () => ({
  prisma: {
    creator: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
    supporter: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null }, _count: 0 }),
      groupBy: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: vi.fn((cb: any) => cb({ supporter: { upsert: vi.fn().mockResolvedValue({}) }, creator: { upsert: vi.fn().mockResolvedValue({}) }, transaction: { create: vi.fn().mockResolvedValue({}) } })),
    $disconnect: vi.fn(),
    $on: vi.fn(),
  },
  disconnectPrisma: vi.fn(),
  default: null,
}));

vi.mock("../../src/lib/redis", () => ({
  getRedis: vi.fn().mockReturnValue(null),
  isRedisConnected: vi.fn().mockReturnValue(false),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDel: vi.fn().mockResolvedValue(undefined),
  cacheDelPattern: vi.fn().mockResolvedValue(undefined),
  disconnectRedis: vi.fn().mockResolvedValue(undefined),
}));

// Now safely import routes
import routes from "../../src/routes/index";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1", routes);
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  // 404 handler for unmatched routes
  app.all("*", (_req, res) => {
    res.status(404).json({ success: false, error: "Route not found", timestamp: new Date().toISOString() });
  });
  app.use(errorHandler);
  return app;
}

describe("Health Endpoint", () => {
  it("GET /health should return 200", async () => {
    const app = createTestApp();
    const res = await supertest(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
  });
});

describe("Creators API", () => {
  it("GET /api/v1/creators should return 200 with creators array", async () => {
    const app = createTestApp();
    const res = await supertest(app).get("/api/v1/creators");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("creators");
    expect(res.body.data).toHaveProperty("pagination");
  });

  it("GET /api/v1/creators/search should return 200", async () => {
    const app = createTestApp();
    const res = await supertest(app).get("/api/v1/creators/search?q=test");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/v1/creators/trending should return 200", async () => {
    const app = createTestApp();
    const res = await supertest(app).get("/api/v1/creators/trending");
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/creators/featured should return 200", async () => {
    const app = createTestApp();
    const res = await supertest(app).get("/api/v1/creators/featured");
    expect(res.status).toBe(200);
  });

  it("GET /api/v1/creators/recent should return 200", async () => {
    const app = createTestApp();
    const res = await supertest(app).get("/api/v1/creators/recent");
    expect(res.status).toBe(200);
  });
});

describe("Creator Detail API", () => {
  it("GET /api/v1/creator/by-username/:username should return 404 for non-existing user", async () => {
    const app = createTestApp();
    const res = await supertest(app)
      .get("/api/v1/creator/by-username/nonexistentuser");
    expect(res.status).toBe(404);
  });
});

describe("Leaderboard API", () => {
  it("GET /api/v1/leaderboard should return 200", async () => {
    const app = createTestApp();
    const res = await supertest(app).get("/api/v1/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Auth API", () => {
  it("POST /api/v1/auth/nonce should return nonce for valid wallet", async () => {
    const app = createTestApp();
    const res = await supertest(app)
      .post("/api/v1/auth/nonce")
      .send({ walletAddress: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("nonce");
    expect(res.body.data).toHaveProperty("message");
    expect(res.body.data).toHaveProperty("expiresAt");
  });

  it("POST /api/v1/auth/nonce should return 400 for missing wallet", async () => {
    const app = createTestApp();
    const res = await supertest(app)
      .post("/api/v1/auth/nonce")
      .send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/v1/auth/verify should return 401 without prior nonce", async () => {
    const app = createTestApp();
    const validWallet = "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd";
    const res = await supertest(app)
      .post("/api/v1/auth/verify")
      .send({ walletAddress: validWallet, signature: "sig", nonce: "nonce" });
    expect(res.status).toBe(401);
  });
});

describe("404 Handler", () => {
  it("should return 404 for unknown routes", async () => {
    const app = createTestApp();
    const res = await supertest(app).get("/api/v1/nonexistent-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

afterAll(() => {
  vi.clearAllMocks();
});
