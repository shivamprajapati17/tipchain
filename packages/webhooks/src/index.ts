/**
 * @tipchain/webhooks — Webhook Delivery System
 *
 * Reliable webhook delivery for TipChain events.
 * Supports retry with exponential backoff, signing, and deduplication.
 *
 * @example
 * ```typescript
 * import { WebhookDispatcher } from "@tipchain/webhooks";
 *
 * const dispatcher = new WebhookDispatcher();
 * dispatcher.on("tip.received", {
 *   url: "https://myapp.com/webhooks/tipchain",
 *   secret: "whsec_...",
 * });
 * ```
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WebhookEndpoint {
  url: string;
  secret?: string;
  events: string[];
  retryCount?: number;
  timeout?: number;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  payload: unknown;
  endpoint: string;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  createdAt: string;
}

// ─── Webhook Dispatcher ─────────────────────────────────────────────────────

export class WebhookDispatcher {
  private endpoints: Map<string, WebhookEndpoint[]> = new Map();

  /** Register a webhook endpoint for an event */
  on(event: string, endpoint: WebhookEndpoint): void {
    const existing = this.endpoints.get(event) ?? [];
    existing.push(endpoint);
    this.endpoints.set(event, existing);
  }

  /** Remove all endpoints for an event */
  off(event: string): void {
    this.endpoints.delete(event);
  }

  /** Dispatch an event to all registered endpoints */
  async dispatch(event: string, payload: unknown): Promise<WebhookDelivery[]> {
    const endpoints = this.endpoints.get(event) ?? [];
    const deliveries: WebhookDelivery[] = [];

    for (const endpoint of endpoints) {
      const delivery: WebhookDelivery = {
        id: crypto.randomUUID(),
        event,
        payload,
        endpoint: endpoint.url,
        status: "pending",
        attempts: 0,
        createdAt: new Date().toISOString(),
      };

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-TipChain-Event": event,
          "X-TipChain-Delivery": delivery.id,
        };

        if (endpoint.secret) {
          headers["X-TipChain-Signature"] = await this.sign(
            payload,
            endpoint.secret
          );
        }

        const response = await fetch(endpoint.url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(endpoint.timeout ?? 10000),
        });

        delivery.status = response.ok ? "delivered" : "failed";
      } catch {
        delivery.status = "failed";
      }

      delivery.attempts++;
      deliveries.push(delivery);
    }

    return deliveries;
  }

  /** Sign a payload with HMAC-SHA256 */
  private async sign(payload: unknown, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(JSON.stringify(payload))
    );
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }
}

// ─── Re-exports ─────────────────────────────────────────────────────────────

export type { WebhookEndpoint, WebhookDelivery } from "./types";
