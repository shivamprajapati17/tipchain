# TipChain Architecture

> **TipChain** is a modular, open-source creator monetization platform built on Solana. This document describes the system architecture, key design decisions, and how the various components interact.

---

## ✦ System Overview

```
                      ┌───────────────┐
                      │   Browser /   │
                      │   Mobile      │
                      └───────┬───────┘
                              │
                    ┌─────────▼─────────┐
                    │   Next.js App     │
                    │   (apps/web)      │
                    │   React 19,       │
                    │   TailwindCSS v4  │
                    └─────────┬─────────┘
                              │ HTTP/WebSocket
                    ┌─────────▼─────────┐
                    │  Express API      │
                    │  (backend/)       │
                    │  REST + Webhooks  │
                    └──┬────────────┬───┘
                       │            │
              ┌────────▼──┐  ┌─────▼──────┐
              │ PostgreSQL │  │   Redis    │
              │ (Prisma)   │  │ (Caching)  │
              └────────────┘  └────────────┘
                       │
              ┌────────▼────────┐
              │  Solana Network │
              │  (Anchor, RPC)  │
              └─────────────────┘
```

## ✦ Architectural Principles

1. **Modularity** — Every feature is a self-contained package
2. **API-first** — All functionality exposed via REST/GraphQL
3. **Extensibility** — Plugin architecture for custom integrations
4. **Self-hostable** — Run anywhere with Docker
5. **Observability** — OpenTelemetry, structured logging, metrics

## ✦ Monorepo Structure

```
tipchain/
├── apps/                    # Application entry points
│   ├── web/                 # Next.js frontend (studio)
│   └── docs/                # Documentation site (Docusaurus/Nextra)
│
├── backend/                 # Express API server
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── lib/             # Shared utilities (Prisma, validation)
│   │   ├── middleware/       # Auth, rate limiting, logging
│   │   ├── services/        # Business logic layer
│   │   └── index.ts         # Server entry point
│   ├── prisma/              # Schema and migrations
│   └── package.json
│
├── packages/                # Shared packages
│   ├── ui/                  # React component library
│   ├── sdk/                 # Universal JavaScript SDK
│   ├── solana/              # Solana program SDK
│   ├── auth/                # Authentication utilities
│   ├── database/            # Database client abstractions
│   ├── webhooks/            # Webhook delivery system
│   └── config/              # Shared configuration
│
├── programs/                # Solana Anchor programs
│   └── tipchain/            # Main on-chain program
│
├── cli/                     # TipChain CLI tool
│
├── plugins/                 # Official plugin marketplace
│
├── docker/                  # Docker configuration
│   ├── Dockerfile           # Multi-stage build
│   ├── docker-compose.yml   # Full stack deployment
│   └── docker-compose.dev.yml
│
└── docs/                    # Documentation content
    ├── api/                 # API reference
    ├── guides/              # User guides
    └── contributing/        # Contributor docs
```

## ✦ Frontend Architecture

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS v4 + shadcn/ui
- **Animation:** Framer Motion
- **Wallet:** @solana/kit, @solana/react-hooks
- **State:** React hooks + server components

### Key Components

```
src/
├── app/                     # Next.js App Router pages
│   ├── creator/[username]/  # Public creator profile
│   ├── creators/            # Creator directory
│   ├── dashboard/           # Creator dashboard
│   ├── leaderboard/         # Supporter leaderboard
│   ├── profile/             # Profile management
│   └── page.tsx             # Landing page
│
├── components/              # Reusable React components
│   ├── ui/                  # shadcn/ui primitives
│   ├── Header.tsx           # Navigation header
│   └── WalletButton.tsx     # Wallet connection UI
│
└── lib/                     # Utilities
    ├── api.ts               # API client (all endpoints)
    └── utils.ts             # cn() helper
```

### Design System

- **Color Palette:** Warm Zinc + Emerald (oklch color space)
- **Effects:** Premium shadows, glass morphism, shimmers
- **Typography:** Geist (sans), Geist Mono (code)
- **Icons:** Lucide React
- **Radius:** Base `0.75rem` with consistent scale

## ✦ Backend Architecture

### Tech Stack
- **Runtime:** Node.js (Express)
- **Language:** TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Validation:** Zod
- **Auth:** Wallet signature verification
- **Caching:** Redis (optional)

### API Routes

| Prefix | Route File | Description |
|--------|-----------|-------------|
| `GET /creators` | `routes/creators.ts` | List/search creators |
| `GET /creator/:wallet` | `routes/creators.ts` | Get creator by wallet |
| `GET /creator/by-username/:username` | `routes/creators.ts` | Get creator by username |
| `POST /creator` | `routes/creators.ts` | Create creator |
| `PUT /creator/:wallet` | `routes/creators.ts` | Update creator |
| `GET /transactions` | `routes/transactions.ts` | List transactions |
| `POST /transaction` | `routes/transactions.ts` | Record transaction |
| `GET /leaderboard` | `routes/leaderboard.ts` | Get leaderboard |
| `GET /supporters/:wallet` | `routes/supporters.ts` | Get supporter profile |
| `GET/POST /badges` | `routes/badges.ts` | Badge system |
| `GET/POST /memberships` | `routes/memberships.ts` | Membership tiers |
| `POST /follow` | `routes/social.ts` | Social features |
| `GET /notifications` | `routes/notifications.ts` | Notifications |
| `GET /analytics` | `routes/analytics.ts` | Creator analytics |
| `GET /admin` | `routes/admin.ts` | Admin endpoints |
| `GET /categories` | `routes/categories.ts` | Categories + search |

### Database Schema (Prisma)

```
User ──── BadgeAward ──── Badge
  │           │
  ├─── Follow (Follower)
  ├─── Comment
  ├─── Notification
  ├─── Transaction (Sender)
  └─── ReferralUse

Creator ──── Category
  │
  ├─── Supporter ──── User
  ├─── Transaction (Receiver)
  ├─── Follow (Creator)
  ├─── Comment
  ├─── CreatorUpdate
  ├─── Milestone
  ├─── MembershipTier ──── Membership
  └─── Referral ──── ReferralUse
```

## ✦ Database Schema

### Core Tables

- **User** — Extended supporter profiles with reputation
- **Creator** — Creator profiles with stats, social links, verification
- **Category** — Creator categories (developers, artists, writers)
- **Supporter** — Tracks tips per creator-supporter pair
- **Transaction** — All tip transactions on-chain and off-chain

### Rewards & Engagement

- **Badge** — Badge definitions (Bronze, Silver, Gold, etc.)
- **BadgeAward** — Per-user badge awards (on-chain minting)
- **MembershipTier** — Creator-defined subscription tiers
- **Membership** — Active subscriber relationships

### Social

- **Follow** — Creator-supporter follow relationships
- **Comment** — Comments on creator profiles
- **CreatorUpdate** — Creator posts/updates
- **Milestone** — Fundraising/revenue milestones

### Growth

- **Referral** — Creator referral codes
- **ReferralUse** — Tracked referral redemptions

### System

- **Notification** — In-app and push notifications
- **DailyAnalytics** — Pre-computed daily analytics snapshots
- **PlatformSetting** — Key-value platform configuration

## ✦ Solana Integration

### Wallet Connection Flow

```
1. User clicks "Connect Wallet"
2. Browser extension (Phantom/Solflare/Backpack) prompts for approval
3. Wallet's public key is provided to the app
4. Optional: User signs a message to verify ownership
5. Session is established via @solana/react-hooks
```

### Tipping Flow

```
1. Supporter enters amount and selects token (SOL/USDC)
2. App initiates transfer via @solana/kit
3. Wallet prompts user to approve transaction
4. Transaction is submitted to Solana network
5. Backend indexes the transaction via RPC
6. Creator stats are updated in PostgreSQL
7. Supporter record is upserted
8. Notification is created for the creator
```

### Smart Contract (Anchor)

```rust
pub mod tipchain {
    pub fn create_creator(ctx: Context<CreateCreator>, username: String, bio: String) -> Result<()>;
    pub fn send_sol_tip(ctx: Context<SendSolTip>, amount: u64, message: Option<String>) -> Result<()>;
    pub fn send_spl_tip(ctx: Context<SendSplTip>, amount: u64, mint: Pubkey, message: Option<String>) -> Result<()>;
}
```

## ✦ Security Architecture

### Authentication
- **Wallet-based** — No passwords, no emails required
- **Signature verification** — Optional message signing for non-custodial auth
- **API Keys** — For programmatic access (coming soon)

### Authorization
- **Creator ownership** — Only wallet address that created a profile can edit it
- **Admin roles** — Platform admin capabilities for verification, featuring
- **Rate limiting** — Per-wallet and per-IP rate limits

### Data Protection
- **Environment variables** — All secrets via `.env`
- **Input validation** — Zod schemas on all API endpoints
- **SQL injection prevention** — Prisma parameterized queries
- **HTTPS** — Enforced in production

## ✦ Performance

| Metric | Target |
|--------|--------|
| Wallet connection | < 2s |
| Profile load | < 1s |
| Transaction confirmation | < 5s (Solana) |
| Lighthouse score | > 90 |
| API response (p95) | < 200ms |
| First meaningful paint | < 1.5s |

## ✦ Deployment Architecture

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
  redis:
    image: redis:7-alpine
  backend:
    build: ./backend
    depends_on: [postgres, redis]
  frontend:
    build: ./apps/web
    depends_on: [backend]
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
```

### CI/CD Pipeline (GitHub Actions)

```
Push → Lint → Typecheck → Test → Build → Deploy
  │       │         │        │       │        │
  └── ESLint  ── tsc ── Vitest ── Next ── Vercel/Railway
```

## ✦ Packages & SDKs

### @tipchain/sdk

```typescript
// Core client
export class TipChainClient {
  creators: CreatorsAPI;
  tips: TipsAPI;
  analytics: AnalyticsAPI;
  admin: AdminAPI;
}

// React hooks
export function useCreator(username: string): UseQueryResult<Creator>;
export function useSendTip(): UseMutationResult<TipResult, Error, TipInput>;
export function useDashboard(wallet: string): UseQueryResult<DashboardData>;
```

### @tipchain/ui

```
Button, Input, Card, Badge, Avatar, WalletButton,
TipCard, CreatorCard, StatCard, LeaderboardRow,
TransactionRow, SupporterRow, SectionShell
```

## ✦ Plugin Architecture

Plugins are npm packages with the `@tipchain/plugin-` prefix.

```typescript
interface TipChainPlugin {
  name: string;
  version: string;
  hooks: {
    onTipReceived?: (tip: Tip) => Promise<void>;
    onCreatorCreated?: (creator: Creator) => Promise<void>;
    onMembershipActivated?: (membership: Membership) => Promise<void>;
    onBadgeAwarded?: (badge: BadgeAward) => Promise<void>;
  };
  components?: Record<string, React.ComponentType<any>>;
  apiRoutes?: Router;
}
```

## ✦ Roadmap

### Phase 1 — Foundation (Current) ✅
- [x] Creator profiles with wallet connection
- [x] SOL and USDC tipping
- [x] Dashboard with analytics
- [x] Supporter leaderboard
- [x] Transaction history
- [x] Authentication via wallet

### Phase 2 — Open Source Ecosystem (In Progress) 🔄
- [ ] MIT License + Contribution guide
- [ ] Public monorepo with packages
- [ ] CLI tool
- [ ] Docker Compose deployment
- [ ] Documentation site
- [ ] Plugin system design

### Phase 3 — Monetization 🚧
- [ ] Membership subscriptions
- [ ] NFT supporter badges
- [ ] Fiat on-ramp (MoonPay/Stripe)
- [ ] Referral rewards
- [ ] Organization accounts

### Phase 4 — Scale 🚀
- [ ] GraphQL API
- [ ] WebSocket real-time updates
- [ ] Mobile app (React Native)
- [ ] Multi-chain support
- [ ] AI-powered analytics

---

*Architecture is a living document. PRs welcome!*
