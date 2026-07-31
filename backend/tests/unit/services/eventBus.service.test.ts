import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { emitEvent } from "../../../src/services/eventBus.service";

vi.mock("../../../src/utils/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import logger from "../../../src/utils/logger";

const DEFAULT_URL = "http://localhost:5678/webhook/tipchain-events-v4";

describe("EventBus", () => {
  const originalUrl = process.env.N8N_WEBHOOK_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.N8N_WEBHOOK_URL;
  });

  afterEach(() => {
    if (originalUrl) {
      process.env.N8N_WEBHOOK_URL = originalUrl;
    } else {
      delete process.env.N8N_WEBHOOK_URL;
    }
    vi.unstubAllGlobals();
  });

  it("POSTs {event, payload} to the default webhook URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    await emitEvent("tip.received", { amount: 1.5, currency: "SOL" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe(DEFAULT_URL);
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body)).toEqual({
      event: "tip.received",
      payload: { amount: 1.5, currency: "SOL" },
    });
  });

  it("uses N8N_WEBHOOK_URL env var when set", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/tipchain-events-v4";
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    await emitEvent("creator.created", { wallet: "abc" });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://n8n.example.com/webhook/tipchain-events-v4");
  });

  it("logs info on successful delivery", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    await emitEvent("membership.activated", { tierId: "t1" });

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("membership.activated")
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("never throws when the webhook is unreachable — warns instead", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", mockFetch);

    await expect(emitEvent("defi.staked", { amount: 5 })).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("defi.staked")
    );
  });
});
