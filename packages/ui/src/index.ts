/**
 * @tipchain/ui — Shared React UI Components
 *
 * Reusable component library for the TipChain ecosystem.
 * Built on shadcn/ui primitives and TailwindCSS v4.
 */

// ─── Utility ────────────────────────────────────────────────────────────────

export { cn } from "./utils";

// ─── Layout Components ──────────────────────────────────────────────────────

export { Section } from "./section";
export { EmptyState } from "./empty-state";
export type { EmptyStateProps } from "./empty-state";

// ─── Data Display ───────────────────────────────────────────────────────────

export { StatCard } from "./stat-card";
export type { StatCardProps } from "./stat-card";

export { CreatorCard } from "./creator-card";
export type { CreatorCardProps } from "./creator-card";

export { WalletAddress } from "./wallet-address";
export type { WalletAddressProps } from "./wallet-address";

// ─── Feedback / Indicators ──────────────────────────────────────────────────

export { Badge } from "./badge";
export type { BadgeProps } from "./badge";

export { PulseDot } from "./pulse-dot";
export type { PulseDotProps } from "./pulse-dot";

export { Skeleton } from "./skeleton";
export type { SkeletonProps } from "./skeleton";

export { CopyButton } from "./copy-button";
export type { CopyButtonProps } from "./copy-button";
