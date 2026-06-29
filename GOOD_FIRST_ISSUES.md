# Good First Issues

Welcome to TipChain! Here are curated first issues for new contributors. Each issue is scoped to be completable in a single PR.

## 🎨 Frontend (Next.js / React)

### Add Avatar Upload to Profile Page
Enable creators to upload an avatar image (currently only URL input is supported). Use the Cloudinary or local storage provider.

**Skills:** React, file upload, API integration
**Files:** `apps/web/src/app/profile/page.tsx`

### Add Loading Skeleton for Creator Profile
The creator profile page at `creator/[username]` could benefit from a proper skeleton loader while data is being fetched.

**Skills:** React, TailwindCSS, Framer Motion
**Files:** `apps/web/src/app/creator/[username]/page.tsx`

### Add Dark Mode Toggle
TipChain supports dark mode via CSS variables. Add a toggle button in the header to switch between light and dark themes.

**Skills:** React, TailwindCSS, localStorage
**Files:** `apps/web/src/components/Header.tsx`, `apps/web/src/app/globals.css`

## 🖥️ Backend (Express / Prisma)

### Add API Health Endpoint Tests
The `/health` endpoint exists but has no test coverage. Add unit tests using Supertest.

**Skills:** TypeScript, Express, testing patterns
**Files:** `backend/src/index.ts`

### Add Pagination Support for Transactions
The transactions endpoint currently uses `limit` but doesn't support cursor-based or offset-based pagination properly.

**Skills:** TypeScript, Prisma, REST API design
**Files:** `backend/src/routes/transactions.ts`

### Add Creator Search by Category
The search endpoint exists but doesn't filter by creator tags. Add tag-based filtering.

**Skills:** TypeScript, Prisma, Express
**Files:** `backend/src/routes/categories.ts`

## 📦 Packages (SDK / CLI)

### Add Error Handling Examples to SDK
The SDK currently throws generic errors. Add typed error classes and better error messages for common failure modes.

**Skills:** TypeScript, software design
**Files:** `packages/sdk/src/index.ts`

### Add `tipchain stats` Command
Add a new CLI command that shows platform-wide statistics (total creators, transactions, volume).

**Skills:** TypeScript, CLI design
**Files:** `cli/src/index.ts`

### Add `@tipchain/sdk-python` Stub
Create a Python package stub for the TipChain SDK. This helps us gauge community interest in a Python SDK.

**Skills:** Python, package publishing
**Files:** `packages/` (new)

## 📝 Documentation

### Add Quick Start Video to README
Create a short screen recording showing the setup process (clone → install → run) and link it in the README.

**Skills:** Screen recording, markdown

### Translate Documentation to Spanish
Translate the `README.md` and `CONTRIBUTING.md` into Spanish.

**Skills:** Translation, markdown

## 🐛 Bug Fixes

### Fix: Leaderboard Shows Duplicate Entries
The leaderboard endpoint aggregates by wallet but can show duplicate entries for supporters who tipped multiple creators.

**Skills:** TypeScript, Prisma
**Files:** `backend/src/routes/leaderboard.ts`

### Fix: Wallet Disconnect Not Clearing State
When a user disconnects their wallet, the profile page doesn't reset to the unconnected state.

**Skills:** React, Solana wallet adapter
**Files:** `apps/web/src/app/profile/page.tsx`

---

**Labels to use in GitHub:**
- `good first issue`
- `help wanted`
- `frontend`, `backend`, `sdk`, `cli`, `docs`

**Seen a bug you want to fix?** Open an issue or jump straight to a PR!
