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

import {
  getQuote,
  getSwapInstructions,
  getTokenInfo,
  searchTokens,
  type SwapQuote,
  type SwapInstructions,
} from "../../../src/services/jupiter.service";

// ─── Helpers ────────────────────────────────────────────────────────────────

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const BONK_MINT = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";

function createMockQuote(overrides: Partial<SwapQuote> = {}): SwapQuote {
  return {
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    inAmount: "1000000000",
    outAmount: "1000000",
    otherAmountThreshold: "990000",
    priceImpactPct: "0.05",
    routePlan: [
      {
        swapInfo: {
          ammKey: "amm123",
          label: "Orca",
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          inAmount: "1000000000",
          outAmount: "1000000",
          feeAmount: "3000",
          feeMint: USDC_MINT,
        },
        percent: 100,
      },
    ],
    platformFee: null,
    contextSlot: 123456789,
    timeTaken: 0.052,
    ...overrides,
  };
}

function createMockInstructions(overrides: Partial<SwapInstructions> = {}): SwapInstructions {
  return {
    tokenLedgerInstruction: null,
    computeBudgetInstructions: [{ programId: "ComputeBudget111111111111111111111111111111", accounts: [], data: "AQAAAA" }],
    setupInstructions: [],
    swapInstruction: { programId: "JUP6LkbZjcSXrNKeKcC7Xm7GJcCjQ3fTjTZrKJcYzJw", accounts: [], data: "test" },
    cleanupInstruction: null,
    addressLookupTableAddresses: [],
    ...overrides,
  };
}

function createSuccessfulResponse(data: any) {
  return {
    ok: true,
    json: () => Promise.resolve(data),
  };
}

function createErrorResponse(status: number = 400) {
  return {
    ok: false,
    status,
    text: () => Promise.resolve("Error occurred"),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("getQuote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch a quote and return parsed data", async () => {
    const mockQuote = createMockQuote();
    mockFetch.mockResolvedValueOnce(createSuccessfulResponse(mockQuote));

    const quote = await getQuote(SOL_MINT, USDC_MINT, "1000000000");

    expect(quote).toEqual(mockQuote);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should include correct URL parameters", async () => {
    mockFetch.mockResolvedValueOnce(createSuccessfulResponse(createMockQuote()));

    await getQuote(SOL_MINT, USDC_MINT, "500000000", 100);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("inputMint=" + SOL_MINT);
    expect(url).toContain("outputMint=" + USDC_MINT);
    expect(url).toContain("amount=500000000");
    expect(url).toContain("slippageBps=100");
  });

  it("should use default slippage of 50 bps (0.5%)", async () => {
    mockFetch.mockResolvedValueOnce(createSuccessfulResponse(createMockQuote()));

    await getQuote(SOL_MINT, USDC_MINT, "1000000000");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("slippageBps=50");
  });

  it("should return null on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(createErrorResponse(400));

    const quote = await getQuote(SOL_MINT, USDC_MINT, "1000000000");

    expect(quote).toBeNull();
  });

  it("should return null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    const quote = await getQuote(SOL_MINT, USDC_MINT, "1000000000");

    expect(quote).toBeNull();
  });

  it("should return null on malformed JSON response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error("JSON parse error")),
    });

    const quote = await getQuote(SOL_MINT, USDC_MINT, "1000000000");

    expect(quote).toBeNull();
  });
});

describe("getSwapInstructions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch swap instructions with quote response", async () => {
    const mockInstructions = createMockInstructions();
    mockFetch.mockResolvedValueOnce(createSuccessfulResponse(mockInstructions));

    const quote = createMockQuote();
    const instructions = await getSwapInstructions(quote, "user-wallet-address");

    expect(instructions).toEqual(mockInstructions);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should POST to the correct endpoint", async () => {
    mockFetch.mockResolvedValueOnce(createSuccessfulResponse(createMockInstructions()));

    await getSwapInstructions(createMockQuote(), "user-wallet");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("swap-instructions");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
  });

  it("should send the userPublicKey and quoteResponse in the body", async () => {
    mockFetch.mockResolvedValueOnce(createSuccessfulResponse(createMockInstructions()));

    const quote = createMockQuote();
    await getSwapInstructions(quote, "user-wallet-123");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.userPublicKey).toBe("user-wallet-123");
    expect(body.quoteResponse).toEqual(quote);
    expect(body.wrapUnwrapSOL).toBe(true);
    expect(body.dynamicComputeUnitLimit).toBe(true);
  });

  it("should return null on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(createErrorResponse(500));

    const result = await getSwapInstructions(createMockQuote(), "wallet");
    expect(result).toBeNull();
  });

  it("should return null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Timeout"));

    const result = await getSwapInstructions(createMockQuote(), "wallet");
    expect(result).toBeNull();
  });
});

describe("getTokenInfo", () => {
  it("should return info for SOL mint", () => {
    const info = getTokenInfo(SOL_MINT);
    expect(info).not.toBeNull();
    expect(info?.symbol).toBe("SOL");
    expect(info?.name).toBe("Solana");
    expect(info?.decimals).toBe(9);
  });

  it("should return info for USDC mint", () => {
    const info = getTokenInfo(USDC_MINT);
    expect(info?.symbol).toBe("USDC");
    expect(info?.decimals).toBe(6);
  });

  it("should return info for BONK mint", () => {
    const info = getTokenInfo(BONK_MINT);
    expect(info?.symbol).toBe("BONK");
    expect(info?.decimals).toBe(5);
  });

  it("should return null for unknown mint", () => {
    const info = getTokenInfo("UnknownMintAddress1234567890123456789012345678901");
    expect(info).toBeNull();
  });

  it("should return null for empty string", () => {
    const info = getTokenInfo("");
    expect(info).toBeNull();
  });
});

describe("searchTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should search and return mapped tokens", async () => {
    const mockTokens = [
      { address: SOL_MINT, symbol: "SOL", name: "Solana", decimals: 9, logoURI: null, dailyVolume: 1000000 },
      { address: USDC_MINT, symbol: "USDC", name: "USD Coin", decimals: 6, logoURI: null, dailyVolume: 2000000 },
    ];
    mockFetch.mockResolvedValueOnce(createSuccessfulResponse(mockTokens));

    const tokens = await searchTokens("SOL");

    expect(tokens).toHaveLength(2);
    expect(tokens[0].symbol).toBe("SOL");
    expect(tokens[0].isKnown).toBe(true); // SOL is in KNOWN_TOKENS
    expect(tokens[1].symbol).toBe("USDC");
    expect(tokens[1].isKnown).toBe(true);
  });

  it("should mark unknown tokens as isKnown=false", async () => {
    const mockTokens = [
      { address: "Unknown111111111111111111111111111111111111", symbol: "XYZ", name: "Unknown Token", decimals: 9, logoURI: null, dailyVolume: 0 },
    ];
    mockFetch.mockResolvedValueOnce(createSuccessfulResponse(mockTokens));

    const tokens = await searchTokens("XYZ");

    expect(tokens).toHaveLength(1);
    expect(tokens[0].symbol).toBe("XYZ");
    expect(tokens[0].isKnown).toBe(false);
  });

  it("should encode the query in URL", async () => {
    mockFetch.mockResolvedValueOnce(createSuccessfulResponse([]));

    await searchTokens("USDC");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("USDC");
  });

  it("should return empty array on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(createErrorResponse(404));

    const tokens = await searchTokens("SOL");
    expect(tokens).toEqual([]);
  });

  it("should return empty array on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("API unavailable"));

    const tokens = await searchTokens("SOL");
    expect(tokens).toEqual([]);
  });

  it("should handle non-array response", async () => {
    mockFetch.mockResolvedValueOnce(createSuccessfulResponse({ not: "an array" }));

    const tokens = await searchTokens("test");
    expect(tokens).toEqual([]);
  });
});
