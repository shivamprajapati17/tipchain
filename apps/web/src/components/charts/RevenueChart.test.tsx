import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevenueChart } from "./RevenueChart";

// Mock the API module
vi.mock("@/lib/api", () => ({
  getRevenueData: vi.fn(),
  lamportsToSol: (lamports: string | number | bigint) => Number(lamports) / 1e9,
  getTipAnalytics: vi.fn(),
  getGrowthMetrics: vi.fn(),
}));

import { getRevenueData } from "@/lib/api";

// Mock data
const mockRevenueData = {
  wallet: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd",
  days: 30,
  revenue: [
    { date: "2026-06-01T00:00:00.000Z", amount: "1000000000", count: 2 },
    { date: "2026-06-05T00:00:00.000Z", amount: "2500000000", count: 4 },
    { date: "2026-06-10T00:00:00.000Z", amount: "1500000000", count: 3 },
  ],
};

const WALLET = "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd";

describe("RevenueChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    (getRevenueData as any).mockReturnValue(new Promise(() => {})); // Never resolves
    const { container } = render(<RevenueChart walletAddress={WALLET} />);
    // Should show a loading spinner inside a flex-centered container
    const loadingContainer = container.querySelector('.flex.items-center.justify-center');
    expect(loadingContainer).toBeInTheDocument();
  });

  it("should render chart with data after loading", async () => {
    (getRevenueData as any).mockResolvedValue(mockRevenueData);

    render(<RevenueChart walletAddress={WALLET} />);

    // Wait for data to load — header should appear
    expect(await screen.findByText("Revenue (30 days)")).toBeInTheDocument();
  });

  it("should render the AreaChart container when data loads", async () => {
    (getRevenueData as any).mockResolvedValue(mockRevenueData);

    render(<RevenueChart walletAddress={WALLET} />);

    expect(await screen.findByTestId("responsive-container")).toBeInTheDocument();
  });

  it("should show error state when API fails", async () => {
    (getRevenueData as any).mockRejectedValue(new Error("API unavailable"));

    render(<RevenueChart walletAddress={WALLET} />);

    expect(await screen.findByText("API unavailable")).toBeInTheDocument();
  });

  it("should show empty state when no revenue data", async () => {
    (getRevenueData as any).mockResolvedValue({ ...mockRevenueData, revenue: [] });

    render(<RevenueChart walletAddress={WALLET} />);

    expect(await screen.findByText("No revenue data yet")).toBeInTheDocument();
  });

  it("should show loading state when wallet is empty", () => {
    // When walletAddress is empty, useEffect should not call API,
    // but component still renders with loading spinner container
    const { container } = render(<RevenueChart walletAddress="" />);

    expect(getRevenueData).not.toHaveBeenCalled();
    const loadingContainer = container.querySelector('.flex.items-center.justify-center');
    expect(loadingContainer).toBeInTheDocument();
  });

  it("should call getRevenueData with wallet address", async () => {
    (getRevenueData as any).mockResolvedValue(mockRevenueData);

    render(<RevenueChart walletAddress={WALLET} />);

    await screen.findByText("Revenue (30 days)");

    expect(getRevenueData).toHaveBeenCalledWith(WALLET, 30);
  });

  it("should clean up subscriptions on unmount", () => {
    (getRevenueData as any).mockResolvedValue(mockRevenueData);

    const { unmount } = render(<RevenueChart walletAddress={WALLET} />);
    unmount();

    // No errors should occur — the cleanup prevents state updates on unmounted component
    expect(getRevenueData).toHaveBeenCalledTimes(1);
  });
});
