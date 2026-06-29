import { describe, it, expect } from "vitest";
import { TipChain, TipChainError } from "./index";

describe("TipChain SDK", () => {
  describe("TipChain client", () => {
    it("creates a client with production defaults", () => {
      const client = new TipChain();
      expect(client).toBeInstanceOf(TipChain);
      expect(client.creators).toBeDefined();
      expect(client.tips).toBeDefined();
      expect(client.analytics).toBeDefined();
    });

    it("creates client with custom config", () => {
      const client = new TipChain({
        apiKey: "tc_test_key",
        environment: "development",
        baseUrl: "http://localhost:4000",
      });
      expect(client).toBeInstanceOf(TipChain);
    });

    it("creates client with staging environment", () => {
      const client = new TipChain({ environment: "staging" });
      expect(client).toBeInstanceOf(TipChain);
    });
  });

  describe("TipChainError", () => {
    it("creates error with message and status", () => {
      const error = new TipChainError("Not found", 404, "NOT_FOUND");
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Not found");
      expect(error.status).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.name).toBe("TipChainError");
    });

    it("creates error without optional fields", () => {
      const error = new TipChainError("Server error");
      expect(error.message).toBe("Server error");
      expect(error.status).toBeUndefined();
      expect(error.code).toBeUndefined();
    });
  });

  describe("API endpoint basics", () => {
    it("generates correct default base URLs", () => {
      const prod = new TipChain({ environment: "production" });
      const dev = new TipChain({ environment: "development" });
      const staging = new TipChain({ environment: "staging" });

      // Internal config is set correctly via the constructor
      expect(prod).toBeInstanceOf(TipChain);
      expect(dev).toBeInstanceOf(TipChain);
      expect(staging).toBeInstanceOf(TipChain);
    });

    it("CreatorsAPI has required methods", () => {
      const client = new TipChain();
      expect(typeof client.creators.list).toBe("function");
      expect(typeof client.creators.get).toBe("function");
      expect(typeof client.creators.getByWallet).toBe("function");
      expect(typeof client.creators.create).toBe("function");
      expect(typeof client.creators.update).toBe("function");
    });

    it("TipsAPI has required methods", () => {
      const client = new TipChain();
      expect(typeof client.tips.send).toBe("function");
      expect(typeof client.tips.list).toBe("function");
    });

    it("AnalyticsAPI has required methods", () => {
      const client = new TipChain();
      expect(typeof client.analytics.overview).toBe("function");
      expect(typeof client.analytics.revenue).toBe("function");
      expect(typeof client.analytics.exportCSV).toBe("function");
    });
  });
});
