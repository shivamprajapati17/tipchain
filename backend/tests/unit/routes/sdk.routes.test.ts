import { describe, it, expect } from "vitest";
import supertest from "supertest";
import express from "express";

import sdkRoutes from "../../../src/routes/sdk.routes";

function createApp() {
  const app = express();
  app.use(sdkRoutes);
  return app;
}

describe("SDK Info Route", () => {
  it("GET /api/sdk/info should return 200 with package metadata", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/info");

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("@tipchain/sdk");
    expect(res.body.version).toBe("1.0.0");
    expect(res.body.description).toContain("SDK");
    expect(res.body.repository).toContain("github.com");
  });

  it("GET /api/sdk/info should list all packages", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/info");

    expect(res.body.packages).toHaveLength(4);
    const pkgNames = res.body.packages.map((p: any) => p.name);
    expect(pkgNames).toContain("@tipchain/sdk");
    expect(pkgNames).toContain("@tipchain/react-hooks");
    expect(pkgNames).toContain("@tipchain/webhooks");
    expect(pkgNames).toContain("@tipchain/plugins");
  });

  it("GET /api/sdk/info should include quick start guide", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/info");

    expect(res.body.quickStart).toBeDefined();
    expect(res.body.quickStart.install).toBe("npm install @tipchain/sdk");
    expect(res.body.quickStart.usage).toContain("TipChain");
    expect(res.body.quickStart.usage).toContain("apiKey");
    expect(res.body.quickStart.usage).toContain("creators.get");
    expect(res.body.quickStart.usage).toContain("tips.send");
  });

  it("GET /api/sdk/info should have docsUrl for each package", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/info");

    for (const pkg of res.body.packages) {
      expect(pkg.docsUrl).toBeDefined();
      expect(pkg.docsUrl).toContain("/api/sdk/docs/");
    }
  });
});

describe("SDK Reference Route", () => {
  it("GET /api/sdk/reference should return 200", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/reference");

    expect(res.status).toBe(200);
  });

  it("GET /api/sdk/reference should list all endpoint groups", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/reference");

    expect(res.body.baseUrl).toBe("http://localhost:4000");
    expect(res.body.endpoints).toBeDefined();
    expect(res.body.endpoints.length).toBeGreaterThan(10);
  });

  it("GET /api/sdk/reference should have consistent endpoint structure", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/reference");

    for (const group of res.body.endpoints) {
      expect(group.group).toBeDefined();
      expect(Array.isArray(group.endpoints)).toBe(true);

      for (const ep of group.endpoints) {
        expect(ep.method).toBeDefined();
        expect(["GET", "POST", "PUT", "DELETE", "PATCH"]).toContain(ep.method);
        expect(ep.path).toBeDefined();
        expect(ep.path).toContain("/");
        expect(ep.description).toBeDefined();
      }
    }
  });

  it("GET /api/sdk/reference should include Creators group", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/reference");

    const creatorsGroup = res.body.endpoints.find(
      (g: any) => g.group === "Creators"
    );
    expect(creatorsGroup).toBeDefined();
    expect(creatorsGroup.endpoints.some((e: any) => e.path.includes("/api/v1/creators"))).toBe(true);
  });

  it("GET /api/sdk/reference should include DAO group", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/reference");

    const daoGroup = res.body.endpoints.find(
      (g: any) => g.group === "DAO & Organizations"
    );
    expect(daoGroup).toBeDefined();
    expect(daoGroup.endpoints.some((e: any) => e.path.includes("/api/v1/dao"))).toBe(true);
  });

  it("GET /api/sdk/reference should include GraphQL endpoint", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/reference");

    const graphqlGroup = res.body.endpoints.find(
      (g: any) => g.group === "GraphQL"
    );
    expect(graphqlGroup).toBeDefined();
    expect(graphqlGroup.endpoints[0].path).toBe("/api/graphql");
  });

  it("GET /api/sdk/reference should include Solana Actions group", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/reference");

    const actionsGroup = res.body.endpoints.find(
      (g: any) => g.group === "Solana Actions (Blinks)"
    );
    expect(actionsGroup).toBeDefined();
    expect(actionsGroup.endpoints.length).toBeGreaterThanOrEqual(4);
  });

  it("GET /api/sdk/reference should include Jupiter Swap group", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/reference");

    const swapGroup = res.body.endpoints.find(
      (g: any) => g.group === "Jupiter Swap"
    );
    expect(swapGroup).toBeDefined();
    expect(swapGroup.endpoints.some((e: any) => e.path.includes("/api/swap/quote"))).toBe(true);
  });

  it("GET /api/sdk/reference should have creators endpoints with correct methods", async () => {
    const app = createApp();
    const res = await supertest(app).get("/api/sdk/reference");

    const creatorsGroup = res.body.endpoints.find(
      (g: any) => g.group === "Creators"
    );
    const getEndpoints = creatorsGroup.endpoints.filter(
      (e: any) => e.method === "GET"
    );
    const postEndpoints = creatorsGroup.endpoints.filter(
      (e: any) => e.method === "POST"
    );
    const putEndpoints = creatorsGroup.endpoints.filter(
      (e: any) => e.method === "PUT"
    );

    expect(getEndpoints.length).toBeGreaterThanOrEqual(6);
    expect(postEndpoints.length).toBeGreaterThanOrEqual(1);
    expect(putEndpoints.length).toBeGreaterThanOrEqual(1);
  });
});
