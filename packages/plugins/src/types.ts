/**
 * @tipchain/plugins — Type Definitions
 *
 * Core plugin interface and event types for the TipChain plugin system.
 */

import type { Router } from "express";
import type { ComponentType } from "react";

// ─── Events ─────────────────────────────────────────────────────────────────

export interface TipEvent {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  amount: string;
  token: string;
  txHash?: string;
  message?: string;
  timestamp: string;
}

export interface CreatorEvent {
  walletAddress: string;
  username: string;
  displayName?: string | null;
  bio: string;
  avatarUrl: string | null;
}

export interface MembershipEvent {
  id: string;
  tierName: string;
  supporterWallet: string;
  creatorWallet: string;
  price: string;
  token: string;
  startDate: string;
}

export interface BadgeEvent {
  badgeName: string;
  badgeSlug: string;
  walletAddress: string;
  creatorWallet?: string;
  mintAddress?: string;
  awardedAt: string;
}

// ─── Plugin Interface ───────────────────────────────────────────────────────

export interface TipChainPlugin {
  /** Unique plugin identifier (e.g., "nft-rewards") */
  name: string;

  /** Human-readable display name */
  displayName?: string;

  /** Semver version string */
  version: string;

  /** Short description of what the plugin does */
  description?: string;

  /** Plugin author */
  author?: string;

  /** Lifecycle hook: called when the plugin is loaded */
  onLoad?: (context: PluginContext) => Promise<void>;

  /** Lifecycle hook: called when the plugin is unloaded */
  onUnload?: () => Promise<void>;

  /** Hook: triggered when a tip is received */
  onTipReceived?: (tip: TipEvent) => Promise<void>;

  /** Hook: triggered when a creator profile is created */
  onCreatorCreated?: (creator: CreatorEvent) => Promise<void>;

  /** Hook: triggered when a membership is activated */
  onMembershipActivated?: (membership: MembershipEvent) => Promise<void>;

  /** Hook: triggered when a badge is awarded */
  onBadgeAwarded?: (badge: BadgeEvent) => Promise<void>;

  /** Optional React components to inject into the UI */
  components?: Record<string, ComponentType<any>>;

  /** Optional Express router for custom API routes */
  apiRoutes?: Router;

  /** Configuration schema (Zod) for validating plugin settings */
  configSchema?: Record<string, any>;
}

// ─── Plugin Context ─────────────────────────────────────────────────────────

export interface PluginContext {
  /** Plugin configuration (validated against configSchema) */
  config: Record<string, any>;

  /** Database client (Prisma) */
  db: any;

  /** Logger instance */
  logger: {
    info: (msg: string, meta?: any) => void;
    warn: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
  };

  /** Register a custom hook */
  on: (event: string, handler: (...args: any[]) => Promise<void>) => void;

  /** Make HTTP requests to external services */
  fetch: typeof globalThis.fetch;
}

// ─── Plugin Registry ────────────────────────────────────────────────────────

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  entry: string; // Path to the plugin's main module
  enabled: boolean;
  config?: Record<string, any>;
}

// ─── Events Map ─────────────────────────────────────────────────────────────

export type PluginEventName =
  | "tip.received"
  | "tip.sent"
  | "creator.created"
  | "creator.updated"
  | "membership.activated"
  | "membership.cancelled"
  | "badge.awarded"
  | "supporter.followed";

export interface PluginEventMap {
  "tip.received": TipEvent;
  "tip.sent": TipEvent;
  "creator.created": CreatorEvent;
  "creator.updated": CreatorEvent;
  "membership.activated": MembershipEvent;
  "membership.cancelled": MembershipEvent;
  "badge.awarded": BadgeEvent;
  "supporter.followed": { followerWallet: string; creatorWallet: string };
}
