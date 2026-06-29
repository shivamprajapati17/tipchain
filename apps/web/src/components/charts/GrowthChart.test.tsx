import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GrowthChart } from "./GrowthChart";

vi.mock("@/lib/api", () => ({
  getRevenueData: vi.fn(),
  getTipAnalytics: vi.fn(),
  getGrowthMetrics: vi.fn(),
  lamportsToSol: (lamports: string | number | bigint) => Number(lamports) / 1e9,
}));

import { getGrowthMetrics } from "@/lib/api";

const mockGrowthData = {
  wallet: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd",
  currentMonthRevenue: "5000000000",
  previousMonthRevenue: "3000000000",
  revenueGrowthPercent: 66.67,
  currentMonthTransactions: 10,
  previousMonthTransactions: 6,
};

const WALLET = "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd";

describe("GrowthChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    (getGrowthMetrics as any).mockReturnValue(new Promise(() => {}));
    const { container } = render(<GrowthChart walletAddress={WALLET} />);
    const loadingContainer = container.querySelector('.flex.items-center.justify-center');
    expect(loadingContainer).toBeInTheDocument();
  });

  it("should render header after loading", async () => {
    (getGrowthMetrics as any).mockResolvedValue(mockGrowthData);
    render(<GrowthChart walletAddress={WALLET} />);
    expect(await screen.findByText("Month-over-Month")).toBeInTheDocument();
  });

  it("should show positive growth percentage", async () => {
    (getGrowthMetrics as any).mockResolvedValue(mockGrowthData);
    render(<GrowthChart walletAddress={WALLET} />);

    // 66.67% growth should be displayed
    expect(await screen.findByText("66.7%")).toBeInTheDocument();
  });

  it("should show negative growth percentage when revenue decreased", async () => {
    (getGrowthMetrics as any).mockResolvedValue({
      ...mockGrowthData,
      currentMonthRevenue: "1000000000",
      previousMonthRevenue: "5000000000",
      revenueGrowthPercent: -80,
    });

    render(<GrowthChart walletAddress={WALLET} />);

    expect(await screen.findByText("80.0%")).toBeInTheDocument();
  });

  it("should show zero growth when revenue is unchanged", async () => {
    (getGrowthMetrics as any).mockResolvedValue({
      ...mockGrowthData,
      currentMonthRevenue: "3000000000",
      previousMonthRevenue: "3000000000",
      revenueGrowthPercent: 0,
    });

    render(<GrowthChart walletAddress={WALLET} />);

    expect(await screen.findByText("0.0%")).toBeInTheDocument();
  });

  it("should render the BarChart container when data loads", async () => {
    (getGrowthMetrics as any).mockResolvedValue(mockGrowthData);
    render(<GrowthChart walletAddress={WALLET} />);
    expect(await screen.findByTestId("bar-chart")).toBeInTheDocument();
  });

  it("should show stats at bottom", async () => {
    (getGrowthMetrics as any).mockResolvedValue(mockGrowthData);
    render(<GrowthChart walletAddress={WALLET} />);

    expect(await screen.findByText("Current Month TX")).toBeInTheDocument();
    expect(await screen.findByText("10")).toBeInTheDocument(); // current month tx count
    expect(await screen.findByText("Previous Month TX")).toBeInTheDocument();
    expect(await screen.findByText("6")).toBeInTheDocument(); // previous month tx count
  });

  it("should show error state when API fails", async () => {
    (getGrowthMetrics as any).mockRejectedValue(new Error("Service unavailable"));
    render(<GrowthChart walletAddress={WALLET} />);
    expect(await screen.findByText("Service unavailable")).toBeInTheDocument();
  });

  it("should show empty state when no data returned", async () => {
    (getGrowthMetrics as any).mockResolvedValue(null);
    render(<GrowthChart walletAddress={WALLET} />);
    expect(await screen.findByText("No growth data yet")).toBeInTheDocument();
  });

  it("should not call API when wallet is empty", () => {
    render(<GrowthChart walletAddress="" />);
    expect(getGrowthMetrics).not.toHaveBeenCalled();
  });

  it("should call getGrowthMetrics with wallet address", async () => {
    (getGrowthMetrics as any).mockResolvedValue(mockGrowthData);
    render(<GrowthChart walletAddress={WALLET} />);
    await screen.findByText("Month-over-Month");
    expect(getGrowthMetrics).toHaveBeenCalledWith(WALLET);
  });
});
