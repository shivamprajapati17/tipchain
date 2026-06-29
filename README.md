# TipChain ✦

> **Open-source creator monetization infrastructure on Solana.**

<p align="center">
  <a href="https://github.com/tipchain/tipchain/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
  <a href="https://github.com/tipchain/tipchain"><img src="https://img.shields.io/github/stars/tipchain/tipchain?style=flat-square&logo=github" alt="GitHub stars"></a>
  <a href="https://github.com/tipchain/tipchain/actions"><img src="https://img.shields.io/github/actions/workflow/status/tipchain/tipchain/ci.yml?style=flat-square&logo=githubactions" alt="CI"></a>
  <a href="https://discord.gg/tipchain"><img src="https://img.shields.io/badge/discord-join-5865F2?style=flat-square&logo=discord" alt="Discord"></a>
  <a href="https://twitter.com/tipchain"><img src="https://img.shields.io/badge/twitter-follow-000000?style=flat-square&logo=x" alt="Twitter"></a>
  <a href="https://www.npmjs.com/package/tipchain"><img src="https://img.shields.io/npm/v/tipchain?style=flat-square&logo=npm" alt="npm"></a>
  <a href="https://hub.docker.com/r/tipchain/tipchain"><img src="https://img.shields.io/docker/pulls/tipchain/tipchain?style=flat-square&logo=docker" alt="Docker pulls"></a>
</p>

<p align="center">
  <b>
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-features">Features</a> •
    <a href="#-packages">Packages</a> •
    <a href="#-self-hosting">Self-Hosting</a> •
    <a href="#-cli">CLI</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="#-roadmap">Roadmap</a>
  </b>
</p>

---

**Every creator should own their audience, receive direct support without intermediaries, and be able to self-host or extend the platform.**

TipChain is the open-source infrastructure for creator monetization on Solana. It's designed to be:

- **🧩 Modular** — Pick the packages you need, extend what you don't
- **🏠 Self-hostable** — Deploy on your own infrastructure with Docker
- **🔌 Extensible** — Plugin architecture for custom integrations
- **📡 API-first** — REST, GraphQL, and WebSocket APIs
- **🌐 Decentralized** — Built on Solana for trustless, instant payments

## ✦ Features

<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Description</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Creator Profiles</b></td>
      <td>Wallet-connected profiles with custom usernames, bios, links, and themes</td>
      <td>✅</td>
    </tr>
    <tr>
      <td><b>Direct Tipping</b></td>
      <td>Send SOL, USDC, or SPL tokens directly — zero platform fees</td>
      <td>✅</td>
    </tr>
    <tr>
      <td><b>Creator Dashboard</b></td>
      <td>Analytics, earnings, supporter tracking, CSV export, tax reports</td>
      <td>✅</td>
    </tr>
    <tr>
      <td><b>Leaderboard</b></td>
      <td>Gamified supporter rankings based on total tipped</td>
      <td>✅</td>
    </tr>
    <tr>
      <td><b>NFT Badges</b></td>
      <td>On-chain supporter rewards and achievement badges</td>
      <td>✅</td>
    </tr>
    <tr>
      <td><b>Memberships</b></td>
      <td>Recurring subscription tiers with token-gated benefits</td>
      <td>✅</td>
    </tr>
    <tr>
      <td><b>Social Features</b></td>
      <td>Follow, comments, creator updates, activity feed</td>
      <td>✅</td>
    </tr>
    <tr>
      <td><b>Referral System</b></td>
      <td>Trackable referral codes with rewards</td>
      <td>✅</td>
    </tr>
    <tr>
      <td><b>Notifications</b></td>
      <td>Real-time push and in-app notifications</td>
      <td>✅</td>
    </tr>
    <tr>
      <td><b>Organization Accounts</b></td>
      <td>DAOs, companies, and open-source projects receive tips together</td>
      <td>🔄</td>
    </tr>
    <tr>
      <td><b>Plugin System</b></td>
      <td>Extend with Discord roles, Telegram bots, email, AI, analytics</td>
      <td>🔄</td>
    </tr>
    <tr>
      <td><b>SDK &amp; CLI</b></td>
      <td>Developer tooling for integrations and automation</td>
      <td>🔄</td>
    </tr>
  </tbody>
</table>

## ✦ Quick Start

### One-Click Deploy

[![Deploy to Railway](https://img.shields.io/badge/Railway-deploy-0B0D0E?style=flat-square&logo=railway)](https://railway.app/template/tipchain)
[![Deploy to Render](https://img.shields.io/badge/Render-deploy-46E3B7?style=flat-square&logo=render)](https://render.com/deploy?repo=https://github.com/tipchain/tipchain)
[![Deploy on Vercel](https://img.shields.io/badge/Vercel-deploy-000000?style=flat-square&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/tipchain/tipchain)

### Local Development

```bash
# Clone the repository
git clone https://github.com/tipchain/tipchain.git
cd tipchain

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development servers
npm run dev
```

The frontend will be at [http://localhost:3000](http://localhost:3000) and the API at [http://localhost:4000](http://localhost:4000).

### Using Docker

```bash
docker compose up -d
```

### Using the CLI

```bash
# Install the CLI globally
npm install -g @tipchain/cli

# Initialize a new TipChain deployment
tipchain init

# Check deployment health
tipchain doctor

# Deploy to production
tipchain deploy
```

## ✦ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    TipChain                          │
├──────────────┬──────────────┬───────────────────────┤
│   Frontend   │   Backend    │    Blockchain         │
│  (Next.js)   │  (Express)   │    (Solana)           │
├──────────────┼──────────────┼───────────────────────┤
│  apps/web    │  backend/    │  programs/tipchain    │
│  apps/docs   │  packages/   │  @tipchain/solana     │
└──────────────┴──────────────┴───────────────────────┘
```

For the full architecture breakdown, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## ✦ Packages

TipChain is a modular monorepo. Each package can be used independently.

| Package | Description | Status |
|---------|-------------|--------|
| [`@tipchain/ui`](./packages/ui) | Shared UI component library (React) | 🚧 |
| [`@tipchain/sdk`](./packages/sdk) | Universal JavaScript SDK | 🚧 |
| [`@tipchain/solana`](./packages/solana) | Solana program interaction layer | 🚧 |
| [`@tipchain/auth`](./packages/auth) | Wallet-based authentication | 🚧 |
| [`@tipchain/database`](./packages/database) | Database client and migrations | 🚧 |
| [`@tipchain/webhooks`](./packages/webhooks) | Webhook delivery system | 🚧 |
| [`@tipchain/config`](./packages/config) | Shared configuration and ESLint | 🚧 |
| [`@tipchain/api`](./packages/api) | REST API client | 🚧 |

## ✦ Self-Hosting

TipChain can be deployed anywhere. Supported platforms:

| Platform | Documentation |
|----------|--------------|
| **Docker Compose** | [docker-compose.yml](./docker/docker-compose.yml) |
| **Railway** | One-click deploy template |
| **Render** | One-click deploy template |
| **Vercel** | Frontend + Serverless Functions |
| **Fly.io** | Docker deployment guide |
| **DigitalOcean** | App Platform guide |
| **Coolify** | Self-hosted PaaS guide |
| **Kubernetes** | Helm chart |

### Requirements

- Node.js >= 20
- PostgreSQL >= 15
- Redis >= 7 (for caching and queues)
- Solana RPC endpoint (Helius, QuickNode, or public)

## ✦ CLI

```bash
tipchain init          # Initialize TipChain in your project
tipchain deploy        # Deploy to production
tipchain sync          # Sync on-chain data
tipchain creator create # Create a creator profile
tipchain analytics     # View analytics from CLI
tipchain plugin install # Install a plugin
tipchain doctor        # Diagnose deployment issues
```

## ✦ Plugin System

TipChain's plugin architecture lets you extend the platform without modifying core code.

**Available plugin types:**
- **NFT Rewards** — Auto-mint badges on tipping milestones
- **Discord Roles** — Sync membership tiers to Discord
- **Telegram Bots** — Receive notifications via Telegram
- **Email** — Transaction receipts, weekly digests
- **Analytics** — Custom analytics providers (PostHog, Plausible)
- **AI Assistants** — Chat with your analytics, auto-reply to supporters
- **Payment Providers** — Fiat on-ramps, additional tokens

```bash
tipchain plugin install nft-rewards
tipchain plugin install discord-roles
tipchain plugin install telegram-bot
```

## ✦ SDK

```typescript
import { TipChain } from "@tipchain/sdk";

const client = new TipChain({
  apiKey: "tc_...",
  environment: "production",
});

// Get a creator profile
const creator = await client.creators.get("username");

// Send a tip
const tx = await client.tips.send({
  to: "creator_wallet",
  amount: 1.5,
  token: "SOL",
  message: "Love your work!",
});

// Query analytics
const analytics = await client.analytics.overview("wallet");
```

**Available SDK variants:**
- `@tipchain/sdk` — JavaScript / TypeScript
- `@tipchain/sdk-react` — React hooks
- `@tipchain/sdk-next` — Next.js utilities
- `@tipchain/sdk-python` — Python (coming soon)
- `@tipchain/sdk-rust` — Rust (coming soon)

## ✦ API

### REST API

```
Base URL: https://api.tipchain.dev/v1
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/creators` | List all creators |
| `GET` | `/creators/:username` | Get creator profile |
| `POST` | `/creators` | Create creator |
| `PUT` | `/creators/:wallet` | Update creator |
| `GET` | `/creators/:wallet/tips` | Get tips for creator |
| `POST` | `/tips` | Send a tip |
| `GET` | `/leaderboard` | Get supporter leaderboard |
| `GET` | `/analytics/:wallet` | Get creator analytics |

Full API documentation at [docs.tipchain.dev/api](https://docs.tipchain.dev/api).

### GraphQL

```graphql
{
  creator(username: "rahul") {
    username
    totalTips
    supporters(first: 5) {
      walletAddress
      totalTipped
    }
  }
}
```

### Webhooks

Receive real-time events:

```json
{
  "event": "tip.received",
  "data": {
    "sender": "wallet...",
    "receiver": "wallet...",
    "amount": "1.5",
    "token": "SOL",
    "timestamp": "2026-06-24T12:00:00Z"
  }
}
```

## ✦ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, TailwindCSS v4, shadcn/ui, Framer Motion |
| **Backend** | Node.js, Express, Prisma, PostgreSQL, Redis |
| **Blockchain** | Solana, Anchor, @solana/kit, Jupiter, Metaplex |
| **Infrastructure** | Docker, GitHub Actions, Vercel, Railway |
| **Monitoring** | OpenTelemetry, Sentry, PostHog |

## ✦ Project Structure

```
tipchain/
├── apps/
│   ├── web/                 # Main Next.js frontend
│   └── docs/                # Documentation site
├── backend/                 # Express API server
├── programs/                # Solana Anchor programs
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── sdk/                 # JavaScript/TypeScript SDK
│   ├── solana/              # Solana interaction layer
│   ├── auth/                # Wallet auth utilities
│   ├── database/            # Database client
│   ├── webhooks/            # Webhook system
│   └── config/              # Shared config
├── cli/                     # TipChain CLI
├── plugins/                 # Official plugins
├── docker/                  # Docker configuration
├── .github/                 # GitHub templates & workflows
└── docs/                    # Documentation content
```

## ✦ Contributing

We welcome contributions from everyone! Whether you're fixing a bug, adding a feature, or improving documentation — you're awesome.

- [Contribution Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Good First Issues](https://github.com/tipchain/tipchain/labels/good%20first%20issue)
- [Roadmap](https://github.com/tipchain/tipchain/issues/1)

## ✦ Community

- 💬 [Discord](https://discord.gg/tipchain) — Chat with the community
- 🐦 [Twitter](https://twitter.com/tipchain) — Follow for updates
- 📝 [Blog](https://blog.tipchain.dev) — Engineering and product updates
- 🎯 [Roadmap](https://github.com/orgs/tipchain/projects/1) — Public roadmap
- 🏆 [Showcase](https://github.com/tipchain/tipchain/discussions/categories/showcase) — What you've built

## ✦ License

TipChain is [MIT licensed](./LICENSE). Built with ❤️ for the open-source community.

---

<p align="center">
  <sub>Every creator should own their audience.</sub>
</p>
