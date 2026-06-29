# @tipchain/sdk

> Universal JavaScript SDK for the TipChain creator monetization platform.

## Installation

```bash
npm install @tipchain/sdk
```

## Usage

```typescript
import { TipChain } from "@tipchain/sdk";

const client = new TipChain({
  apiKey: "tc_your_api_key",
  environment: "production",
});

// Get a creator
const creator = await client.creators.get("username");

// List creators
const creators = await client.creators.list({ sort: "earnings", limit: 20 });

// Get analytics
const analytics = await client.analytics.overview("wallet_address");
```

## API

### `new TipChain(config)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `""` | API key for authenticated requests |
| `environment` | `"production" \| "staging" \| "development"` | `"production"` | Environment to connect to |
| `baseUrl` | `string` | Auto-detected | Custom base URL for self-hosted instances |

### Modules

- `client.creators` — Creator profile CRUD
- `client.tips` — Send and query tips
- `client.analytics` — Analytics and reporting

## Self-Hosted

```typescript
const client = new TipChain({
  baseUrl: "https://tipchain.yourdomain.com",
});
```
