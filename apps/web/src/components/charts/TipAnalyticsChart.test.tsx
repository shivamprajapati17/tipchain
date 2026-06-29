import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TipAnalyticsChart } from "./TipAnalyticsChart";

vi.mock("@/lib/api", () => ({
  getRevenueData: vi.fn(),
  getTipAnalytics: vi.fn(),
  getGrowthMetrics: vi.fn(),
  lamportsToSol: (lamports: string | number | bigint) => Number(lamports) / 1e9,
}));

import { getTipAnalytics } from "@/lib/api";

const mockTipAnalytics = {
  totalTips: 8,
  averageTip: "1500000000",
  largestTip: "5000000000",
  tokenBreakdown: [
    { token: "SOL", total: "8000000000", count: 6 },
    { token: "USDC", total: "4000000", count: 2 },
  ],
  topSupporters: [
    { walletAddress: "wallet1", totalTipped: "5000000000", tipCount: 3 },
    { walletAddress: "wallet2", totalTipped: "3000000000", tipCount: 2 },
  ],
};

const WALLET = "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r";

describe("TipAnalyticsChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    (getTipAnalytics as any).mockReturnValue(new Promise(() => {}));
    const { container } = render(<TipAnalyticsChart walletAddress={WALLET} />);
    const loadingContainer = container.querySelector('.flex.items-center.justify-center');
    expect(loadingContainer).toBeInTheDocument();
  });

  it("should render header after loading", async () => {
    (getTipAnalytics as any).mockResolvedValue(mockTipAnalytics);
    render(<TipAnalyticsChart walletAddress={WALLET} />);
    expect(await screen.findByText("Token Breakdown")).toBeInTheDocument();
  });

  it("should render the BarChart container when data loads", async () => {
    (getTipAnalytics as any).mockResolvedValue(mockTipAnalytics);
    render(<TipAnalyticsChart walletAddress={WALLET} />);
    expect(await screen.findByTestId("bar-chart")).toBeInTheDocument();
  });

  it("should show average and largest tip in header", async () => {
    (getTipAnalytics as any).mockResolvedValue(mockTipAnalytics);
    render(<TipAnalyticsChart walletAddress={WALLET} />);

    // Average tip: 1,500,000,000 lamports = 1.5 SOL
    expect(await screen.findByText(/Avg/)).toBeInTheDocument();
    expect(await screen.findByText(/Largest/)).toBeInTheDocument();
  });

  it("should show summary stats at bottom", async () => {
    (getTipAnalytics as any).mockResolvedValue(mockTipAnalytics);
    render(<TipAnalyticsChart walletAddress={WALLET} />);

    expect(await screen.findByText("Total Tips")).toBeInTheDocument();
    expect(await screen.findByText("Total Volume")).toBeInTheDocument();
  });

  it("should show error state when API fails", async () => {
    (getTipAnalytics as any).mockRejectedValue(new Error("Rate limited"));
    render(<TipAnalyticsChart walletAddress={WALLET} />);
    expect(await screen.findByText("Rate limited")).toBeInTheDocument();
  });

  it("should show empty state when no token breakdown data", async () => {
    (getTipAnalytics as any).mockResolvedValue({
      ...mockTipAnalytics,
      tokenBreakdown: [],
    });
    render(<TipAnalyticsChart walletAddress={WALLET} />);
    expect(await screen.findByText("No transaction data yet")).toBeInTheDocument();
  });

  it("should not call API when wallet is empty", () => {
    render(<TipAnalyticsChart walletAddress="" />);
    expect(getTipAnalytics).not.toHaveBeenCalled();
  });

  it("should call getTipAnalytics with wallet address", async () => {
    (getTipAnalytics as any).mockResolvedValue(mockTipAnalytics);
    render(<TipAnalyticsChart walletAddress={WALLET} />);
    await screen.findByText("Token Breakdown");
    expect(getTipAnalytics).toHaveBeenCalledWith(WALLET);
  });
});
