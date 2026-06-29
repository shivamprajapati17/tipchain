# TipChain + PostHog Analytics Example

> Integrate TipChain events with PostHog for advanced product analytics.

## Setup

```bash
npm install @tipchain/plugins posthog-node
```

## Usage

```typescript
import type { TipChainPlugin } from "@tipchain/plugins";
import { PostHog } from "posthog-node";

const client = new PostHog(process.env.POSTHOG_API_KEY!, {
  host: process.env.POSTHOG_HOST,
});

export const PostHogPlugin: TipChainPlugin = {
  name: "posthog-analytics",
  version: "1.0.0",

  async onTipReceived(tip) {
    client.capture({
      distinctId: tip.receiverWallet,
      event: "tip_received",
      properties: {
        amount: tip.amount,
        token: tip.token,
        sender: tip.senderWallet,
      },
    });
  },

  async onCreatorCreated(creator) {
    client.capture({
      distinctId: creator.walletAddress,
      event: "creator_created",
      properties: {
        username: creator.username,
      },
    });
  },
};
```

## What This Demonstrates

- Building a TipChain plugin with event hooks
- Integrating with third-party analytics
- Capturing structured blockchain events
