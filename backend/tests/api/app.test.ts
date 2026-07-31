import { describe, it, expect, vi } from "vitest";
import supertest from "supertest";

// Mock Prisma & Redis BEFORE importing the app (routes pull in repositories)
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
    $transaction: vi.fn((cb: any) =>
      cb({
        supporter: { upsert: vi.fn().mockResolvedValue({}) },
        creator: { upsert: vi.fn().mockResolvedValue({}) },
        transaction: { create: vi.fn().mockResolvedValue({}) },
      })
    ),
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

import app from "../../src/app";

describe("App Health & Metrics", () => {
  it("GET /health returns 200 with status ok", async () => {
    const res = await supertest(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("environment");
  });

  it("GET /health reports the test environment", async () => {
    const res = await supertest(app).get("/health");
    expect(res.body.environment).toBe("test");
  });

  it("GET /metrics returns 200 with memory and process info", async () => {
    const res = await supertest(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("memory");
    expect(res.body.memory).toHaveProperty("rss");
    expect(res.body.memory).toHaveProperty("heapUsed");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("pid");
    expect(res.body).toHaveProperty("nodeVersion");
  });

  it("GET /unknown returns 404 JSON", async () => {
    const res = await supertest(app).get("/unknown-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Not found");
  });
});
