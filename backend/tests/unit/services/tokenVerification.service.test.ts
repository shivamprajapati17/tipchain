import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("../../../src/utils/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { verifyTokenHolding } from "../../../src/services/tokenVerification.service";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WALLET = "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd";

function buildRpcResponse(result: any) {
  return {
    jsonrpc: "2.0",
    id: 1,
    result,
  };
}

function buildTokenAccount(mint: string, amount: string, decimals: number = 6) {
  return {
    account: {
      data: {
        parsed: {
          info: {
            mint,
            tokenAmount: { amount, decimals },
          },
        },
      },
    },
  };
}

describe("verifyTokenHolding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return qualified:true when no minimum amount required (0)", async () => {
    const result = await verifyTokenHolding(WALLET, USDC_MINT, "0");
    expect(result.qualified).toBe(true);
    expect(result.balance).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return qualified:true when minimum amount is negative", async () => {
    const result = await verifyTokenHolding(WALLET, USDC_MINT, "-100");
    expect(result.qualified).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return qualified:true for empty wallet address", async () => {
    const result = await verifyTokenHolding("", USDC_MINT, "100");
    expect(result.qualified).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return qualified:true for empty mint address", async () => {
    const result = await verifyTokenHolding(WALLET, "", "100");
    expect(result.qualified).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return qualified:true when wallet holds enough tokens", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          buildRpcResponse([
            buildTokenAccount(USDC_MINT, "1000000", 6), // 1 USDC
            buildTokenAccount(USDC_MINT, "2000000", 6), // 2 USDC
          ])
        ),
    });

    const result = await verifyTokenHolding(WALLET, USDC_MINT, "2500000"); // 2.5 USDC min

    expect(result.qualified).toBe(true);
    expect(result.balance).toBe(3000000); // 1 + 2 USDC
    expect(result.requiredAmount).toBe(2500000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should return qualified:false when wallet holds insufficient tokens", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          buildRpcResponse([
            buildTokenAccount(USDC_MINT, "500000", 6), // 0.5 USDC
          ])
        ),
    });

    const result = await verifyTokenHolding(WALLET, USDC_MINT, "1000000"); // 1 USDC min

    expect(result.qualified).toBe(false);
    expect(result.balance).toBe(500000);
    expect(result.requiredAmount).toBe(1000000);
  });

  it("should handle empty token accounts list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(buildRpcResponse([])),
    });

    const result = await verifyTokenHolding(WALLET, USDC_MINT, "100");

    expect(result.qualified).toBe(false);
    expect(result.balance).toBe(0);
  });

  it("should only count balance for the matching mint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          buildRpcResponse([
            buildTokenAccount(USDC_MINT, "1000000", 6),
            buildTokenAccount(SOL_MINT, "500000000", 9), // Different mint — should not count
          ])
        ),
    });

    const result = await verifyTokenHolding(WALLET, USDC_MINT, "1000000");

    expect(result.qualified).toBe(true);
    expect(result.balance).toBe(1000000); // Only USDC counted
  });

  it("should handle accounts with missing parsed data gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          buildRpcResponse([
            { account: { data: {} } }, // Missing parsed info
            buildTokenAccount(USDC_MINT, "500000", 6),
          ])
        ),
    });

    const result = await verifyTokenHolding(WALLET, USDC_MINT, "500000");

    expect(result.qualified).toBe(true);
    expect(result.balance).toBe(500000);
  });

  it("should fail-open on RPC error and return qualified:true", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await verifyTokenHolding(WALLET, USDC_MINT, "1000");

    expect(result.qualified).toBe(true);
    expect(result.balance).toBe(0);
  });

  it("should fail-open on RPC error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          jsonrpc: "2.0",
          id: 1,
          error: { code: -32000, message: "Slot not available" },
        }),
    });

    const result = await verifyTokenHolding(WALLET, USDC_MINT, "1000");

    // Fails open (qualified: true) on RPC errors
    expect(result.qualified).toBe(true);
  });

  it("should call RPC with correct parameters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(buildRpcResponse([])),
    });

    await verifyTokenHolding(WALLET, USDC_MINT, "100");

    // Verify fetch was called with the RPC endpoint
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];

    // Check it's a POST to an RPC URL
    expect(callArgs[1].method).toBe("POST");
    expect(callArgs[1].headers["Content-Type"]).toBe("application/json");

    // Check the RPC body
    const body = JSON.parse(callArgs[1].body);
    expect(body.method).toBe("getTokenAccountsByOwner");
    expect(body.params[0]).toBe(WALLET);
    expect(body.params[1].mint).toBe(USDC_MINT);
    expect(body.params[2].encoding).toBe("jsonParsed");
  });
});
