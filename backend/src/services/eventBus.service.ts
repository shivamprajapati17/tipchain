import logger from "../utils/logger";

/**
 * Event Bus — forwards TipChain domain events to the n8n automation webhook.
 *
 * The n8n workflow (`tipchain-ai-automation.json`) exposes a webhook that maps
 * events to AI agents:
 *   - tip.received         -> AI Trading Assistant
 *   - defi.staked          -> AI Yield Optimizer
 *   - badge.awarded        -> AI Quest Generator
 *   - membership.activated -> AI Creator Assistant
 *   - quest.completed      -> AI Quest Generator
 *   - creator.created      -> AI Creator Assistant
 *
 * Sending is fire-and-forget: failures are logged but NEVER fail the main
 * request flow. The webhook URL is configurable via N8N_WEBHOOK_URL so it can
 * point to a public n8n instance in production (or localhost:5678 in dev).
 */

const DEFAULT_WEBHOOK_URL = "http://localhost:5678/webhook/tipchain-events-v4";

function getWebhookUrl(): string {
  return process.env.N8N_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
}

export interface DomainEvent {
  event: string;
  payload: Record<string, unknown>;
}

/**
 * Emit a domain event to the n8n webhook. Never throws — always resolves.
 */
export async function emitEvent(
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const url = getWebhookUrl();

  try {
    // Fire-and-forget: short timeout so it never blocks the main flow.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, payload } satisfies DomainEvent),
        signal: controller.signal,
      });
      logger.info(`Event emitted to n8n: ${event}`);
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    logger.warn(`Event not delivered to n8n (${event}): ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const eventBus = { emit: emitEvent };
