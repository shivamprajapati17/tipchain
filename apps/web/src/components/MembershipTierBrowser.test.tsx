import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MembershipTierBrowser } from "./MembershipTierBrowser";

vi.mock("@/lib/api", () => ({
  getCreatorMemberships: vi.fn(),
  getMySubscriptions: vi.fn(),
  subscribeToTier: vi.fn(),
  lamportsToSol: (lamports: string | number | bigint) => Number(lamports) / 1e9,
  getRevenueData: vi.fn(),
  getTipAnalytics: vi.fn(),
  getGrowthMetrics: vi.fn(),
}));

import {
  getCreatorMemberships,
  getMySubscriptions,
  subscribeToTier,
} from "@/lib/api";

const CREATOR_WALLET = "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd";
const CURRENT_WALLET = "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r";

const mockTiers = [
  {
    id: "tier_1",
    name: "Gold",
    description: "Premium support tier",
    price: "1",
    token: "SOL",
    benefits: ["Early access", "Shoutout"],
    color: "#ffd700",
    subscriberCount: 5,
    maxSubscribers: 50,
  },
  {
    id: "tier_2",
    name: "Diamond",
    description: "Ultimate tier",
    price: "5",
    token: "SOL",
    benefits: ["All benefits", "1-on-1 call", "Custom badge"],
    color: "#b9f2ff",
    subscriberCount: 2,
    maxSubscribers: null,
    requiredToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    requiredTokenAmount: "1000000",
    requiredTokenSymbol: "USDC",
  },
];

const mockSubscriptions = [
  { id: "sub_1", tierId: "tier_1", status: "active" },
];

describe("MembershipTierBrowser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading skeleton initially", () => {
    (getCreatorMemberships as any).mockReturnValue(new Promise(() => {}));
    (getMySubscriptions as any).mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet={CURRENT_WALLET}
      />
    );

    // Loading state shows shimmer elements
    const shimmerElements = container.querySelectorAll('.shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  it("should render nothing when no tiers exist", async () => {
    (getCreatorMemberships as any).mockResolvedValue({ tiers: [] });
    (getMySubscriptions as any).mockResolvedValue({ memberships: [] });

    const { container } = render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet={CURRENT_WALLET}
      />
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(getCreatorMemberships).toHaveBeenCalled();
    });

    // Component should return null when no tiers
    expect(container.innerHTML).toBe("");
  });

  it("should render tier names and prices", async () => {
    (getCreatorMemberships as any).mockResolvedValue({ tiers: mockTiers });
    (getMySubscriptions as any).mockResolvedValue({ memberships: mockSubscriptions });

    render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet={CURRENT_WALLET}
      />
    );

    expect(await screen.findByText("Gold")).toBeInTheDocument();
    expect(await screen.findByText("Diamond")).toBeInTheDocument();
    expect(await screen.findByText("5 SOL")).toBeInTheDocument();
  });

  it("should show subscription badge for subscribed tier", async () => {
    (getCreatorMemberships as any).mockResolvedValue({ tiers: mockTiers });
    (getMySubscriptions as any).mockResolvedValue({ memberships: mockSubscriptions });

    render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet={CURRENT_WALLET}
      />
    );

    // Gold tier should show "Subscribed" (user is subscribed)
    expect(await screen.findByText("Subscribed")).toBeInTheDocument();
  });

  it("should show Subscribe button for unsubscribed tier", async () => {
    (getCreatorMemberships as any).mockResolvedValue({ tiers: mockTiers });
    (getMySubscriptions as any).mockResolvedValue({ memberships: mockSubscriptions });

    render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet={CURRENT_WALLET}
      />
    );

    // Diamond tier should show Subscribe button (not subscribed)
    const subscribeButtons = await screen.findAllByText("Subscribe");
    expect(subscribeButtons).toHaveLength(1);
  });

  it("should show token-gating badge for tiers with token requirement", async () => {
    (getCreatorMemberships as any).mockResolvedValue({ tiers: mockTiers });
    (getMySubscriptions as any).mockResolvedValue({ memberships: mockSubscriptions });

    render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet={CURRENT_WALLET}
      />
    );

    // Diamond tier has USDC requirement
    expect(await screen.findByText(/Requires.*USDC/)).toBeInTheDocument();
  });

  it("should handle subscribe flow", async () => {
    const user = userEvent.setup();

    (getCreatorMemberships as any).mockResolvedValue({ tiers: mockTiers });
    (getMySubscriptions as any)
      .mockResolvedValueOnce({ memberships: mockSubscriptions })
      .mockResolvedValueOnce({
        memberships: [
          ...mockSubscriptions,
          { id: "sub_2", tierId: "tier_2", status: "active" },
        ],
      });
    (subscribeToTier as any).mockResolvedValue({ id: "sub_2", status: "active" });

    render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet={CURRENT_WALLET}
      />
    );

    // Click Subscribe on Diamond tier
    const subscribeBtn = await screen.findByText("Subscribe");
    await user.click(subscribeBtn);

    // Should call subscribeToTier with the correct tier ID and wallet
    expect(subscribeToTier).toHaveBeenCalledWith("tier_2", CURRENT_WALLET);

    // After subscription refresh, Diamond should show "Subscribed"
    await waitFor(() => {
      const subscribedEls = screen.getAllByText("Subscribed");
      expect(subscribedEls).toHaveLength(2); // Gold + Diamond
    });
  });

  it("should show error when subscription fails", async () => {
    const user = userEvent.setup();

    (getCreatorMemberships as any).mockResolvedValue({ tiers: mockTiers });
    (getMySubscriptions as any).mockResolvedValue({ memberships: mockSubscriptions });
    (subscribeToTier as any).mockRejectedValue(new Error("Insufficient balance"));

    render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet={CURRENT_WALLET}
      />
    );

    const subscribeBtn = await screen.findByText("Subscribe");
    await user.click(subscribeBtn);

    expect(await screen.findByText("Insufficient balance")).toBeInTheDocument();
  });

  it("should disable Subscribe button when no wallet connected", async () => {
    (getCreatorMemberships as any).mockResolvedValue({ tiers: mockTiers });
    (getMySubscriptions as any).mockResolvedValue({ memberships: [] });

    render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet=""
      />
    );

    const subscribeBtns = await screen.findAllByText("Subscribe");
    for (const btn of subscribeBtns) {
      expect(btn).toBeDisabled();
    }
  });

  it("should show tier benefits as badges", async () => {
    (getCreatorMemberships as any).mockResolvedValue({ tiers: mockTiers });
    (getMySubscriptions as any).mockResolvedValue({ memberships: mockSubscriptions });

    render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet={CURRENT_WALLET}
      />
    );

    expect(await screen.findByText("Early access")).toBeInTheDocument();
    expect(await screen.findByText("Shoutout")).toBeInTheDocument();
    expect(await screen.findByText("1-on-1 call")).toBeInTheDocument();
    expect(await screen.findByText("Custom badge")).toBeInTheDocument();
  });

  it("should show subscriber count for tiers with max", async () => {
    (getCreatorMemberships as any).mockResolvedValue({ tiers: mockTiers });
    (getMySubscriptions as any).mockResolvedValue({ memberships: mockSubscriptions });

    render(
      <MembershipTierBrowser
        creatorWallet={CREATOR_WALLET}
        currentWallet={CURRENT_WALLET}
      />
    );

    expect(await screen.findByText("5/50 filled")).toBeInTheDocument();
  });
});
