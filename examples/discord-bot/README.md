# TipChain Discord Bot Example

> A Discord bot that announces tips and manages supporter roles using the TipChain plugin system and SDK.

## Setup

```bash
# Install dependencies
pip install discord.py tipchain-sdk
# or
npm install discord.js @tipchain/sdk
```

## Usage

```typescript
import { TipChain } from "@tipchain/sdk";
import { Client, GatewayIntentBits } from "discord.js";

const client = new TipChain({
  apiKey: process.env.TIPCHAIN_API_KEY,
});

const discord = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// When a tip comes in, announce in Discord
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

// Configure via the TipChain plugin system
// See: packages/plugins/src/types.ts
```

## What This Demonstrates

- Using the `@tipchain/sdk` to query creators and tips
- Receiving webhook events from TipChain
- Transforming blockchain data into Discord notifications

## Files

- `bot.ts` — Main bot entry point
- `commands.ts` — Slash command definitions
- `webhook-handler.ts` — TipChain webhook listener
