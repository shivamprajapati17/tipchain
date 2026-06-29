# TipChain — Agent Guide

This file provides context for AI coding assistants (Claude Code, Codex, Cursor, etc.) working on the TipChain codebase.

## Project Overview

TipChain is an open-source creator monetization platform on Solana. It's a monorepo with:

- **Frontend**: Next.js 16, React 19, TailwindCSS v4, shadcn/ui, Framer Motion
- **Backend**: Node.js, Express, Prisma, PostgreSQL, Redis
- **Blockchain**: Solana, Anchor, @solana/kit, @solana/react-hooks
- **Packages**: SDK, CLI, UI components, config presets

## Key Architecture Decisions

1. **Monorepo** — `/apps/web` (Next.js), `/backend` (Express), `/packages/*` (shared), `/cli`, `/programs`
2. **Database** — Prisma ORM with PostgreSQL. Schema at `backend/prisma/schema.prisma`
3. **API** — Express REST API. All routes in `backend/src/routes/`
4. **Validation** — Zod schemas in `backend/src/lib/validation.ts`
5. **Solana** — `@solana/react-hooks` for frontend wallet, `@solana/kit` for transactions
6. **Styling** — TailwindCSS v4 with OKLCH color space (warm zinc + emerald palette)
7. **Components** — shadcn/ui with `@base-ui/react` primitives

## Naming Conventions

- Files: `kebab-case.ts` or `PascalCase.tsx` for components
- Functions: `camelCase`
- Components: `PascalCase`
- Types: `PascalCase` with `Type` suffix or no suffix
- API routes: `/resource`, `/resource/:id`
- Database tables: `snake_case` with `@map` decorators

## Important Dependencies

- `@solana/kit` and `@solana/react-hooks` — Solana wallet and transaction APIs
- `@base-ui/react` — Low-level UI primitives (used by shadcn)
- `class-variance-authority` — Component variants
- `framer-motion` — Animations
- `lucide-react` — Icons

## Getting Started

```bash
npm install
cp .env.example .env
# Start backend
cd backend && npm run dev
# Start frontend (in another terminal)
cd apps/web && npm run dev
```

## Current Status

- Phase 1 (Foundation) ✅ — Core tipping, profiles, dashboard, leaderboard
- Phase 2 (OS Ecosystem) 🔄 — SDK, CLI, Docker, docs, plugins
- Phase 3 (Monetization) 🚧 — Memberships, NFT badges, fiat on-ramp
- Phase 4 (Scale) 🚀 — GraphQL, WebSockets, mobile, multi-chain
