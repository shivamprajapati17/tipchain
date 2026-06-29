/**
 * @tipchain/analytics — Analytics Utilities
 *
 * Tracking, metrics, and reporting for the TipChain platform.
 * Supports pluggable analytics providers (PostHog, Plausible, self-hosted).
 *
 * @example
 * ```typescript
 * import { AnalyticsService } from "@tipchain/analytics";
 *
 * const analytics = new AnalyticsService({ provider: "posthog", apiKey: "..." });
 * await analytics.track("tip_received", { amount: "1.5", token: "SOL" });
 * ```
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type AnalyticsProvider = "posthog" | "plausible" | "console" | "custom";

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  apiKey?: string;
  host?: string;
  enabled?: boolean;
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  distinctId?: string;
  timestamp?: Date;
}

// ─── Analytics Service ──────────────────────────────────────────────────────

export class AnalyticsService {
  private config: Required<AnalyticsConfig>;

  constructor(config: AnalyticsConfig) {
    this.config = {
      provider: config.provider,
      apiKey: config.apiKey ?? "",
      host: config.host ?? "",
      enabled: config.enabled ?? true,
    };
  }

  /** Track an analytics event */
  async track(event: string, properties?: Record<string, unknown>, distinctId?: string): Promise<void> {
    if (!this.config.enabled) return;

    const payload: AnalyticsEvent = {
      event,
      properties,
      distinctId,
      timestamp: new Date(),
    };

    switch (this.config.provider) {
      case "posthog":
        await this.trackPostHog(payload);
        break;
      case "console":
        console.log("[analytics]", payload);
        break;
      default:
        // Custom provider — dispatch event
        break;
    }
  }

  /** Identify a user */
  async identify(distinctId: string, traits?: Record<string, unknown>): Promise<void> {
    if (!this.config.enabled) return;
    console.log("[analytics] identify:", distinctId, traits);
  }

  /** Flush pending events */
  async flush(): Promise<void> {
    // Implementation depends on provider
  }

  private async trackPostHog(payload: AnalyticsEvent): Promise<void> {
    if (!this.config.apiKey) return;

    await fetch(`${this.config.host || "https://app.posthog.com"}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.config.apiKey,
        event: payload.event,
        properties: payload.properties,
        distinct_id: payload.distinctId ?? "anonymous",
        timestamp: payload.timestamp?.toISOString(),
      }),
    });
  }
}

// ─── Preset Events ──────────────────────────────────────────────────────────

export const Events = {
  TIP_RECEIVED: "tipchain.tip.received",
  TIP_SENT: "tipchain.tip.sent",
  CREATOR_CREATED: "tipchain.creator.created",
  CREATOR_UPDATED: "tipchain.creator.updated",
  MEMBERSHIP_ACTIVATED: "tipchain.membership.activated",
  MEMBERSHIP_CANCELLED: "tipchain.membership.cancelled",
  BADGE_AWARDED: "tipchain.badge.awarded",
  FOLLOWER_GAINED: "tipchain.follower.gained",
  REFERRAL_USED: "tipchain.referral.used",
} as const;
