# Changelog

All notable changes to TipChain will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- 🎉 Open-source MIT license
- 📚 Comprehensive README with badges, quick start, architecture
- 📝 Contribution guide (CONTRIBUTING.md)
- 🤝 Code of Conduct (CODE_OF_CONDUCT.md)
- 🔒 Security policy (SECURITY.md)
- 🏗️ Architecture documentation (ARCHITECTURE.md)
- 📦 Monorepo packages directory with stubs:
  - `@tipchain/sdk` — Universal JavaScript SDK
  - `@tipchain/ui` — React UI components
  - `@tipchain/solana` — Solana interaction layer
  - `@tipchain/auth` — Wallet authentication
  - `@tipchain/database` — Database client
  - `@tipchain/webhooks` — Webhook delivery
  - `@tipchain/config` — Shared configuration
- 🖥️ `@tipchain/cli` — CLI tool (init, deploy, sync, creator, analytics, plugin, doctor)
- 🐳 Docker Compose setup for self-hosting
- 🐳 Multi-stage Dockerfiles for backend and frontend
- 👤 GitHub issue templates (bug report, feature request)
- 👤 GitHub PR template
- 👤 GitHub funding configuration
- 📄 Environment variables example (.env.example)
- 📖 Documentation site structure (Fumadocs/Next.js)
- 📋 CHANGELOG.md
- 🤖 Root-level AGENTS.md and CLAUDE.md for AI coding assistants
- 🔄 Enhanced CI workflow with linting and testing

### Changed

- Updated existing CI workflow for better monorepo support
- Enhanced project structure documentation

### Fixed

- Resolved missing root-level open-source files

## [0.1.0] - 2026-06-24

### Added

- Initial release
- Next.js frontend with creator profiles, dashboard, leaderboard
- Express backend with Prisma ORM and PostgreSQL
- Solana wallet integration via @solana/react-hooks
- SOL and USDC tipping
- Creator analytics and transaction history
- Badge system (NFT supporter rewards)
- Membership tiers and subscriptions
- Social features (follow, comments, updates)
- Referral system
- In-app notifications
- Admin panel endpoints
- Category system with search
- GitHub Actions CI workflow
- PRD and TRD documentation
