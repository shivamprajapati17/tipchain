# Contributing to TipChain

🎉 First off, thank you for considering contributing to TipChain! We're building the open-source infrastructure for creator monetization on Solana, and every contribution matters.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### 🐛 Report a Bug

Found a bug? [Open an issue](https://github.com/tipchain/tipchain/issues/new?template=bug_report.md) with:

- A clear, descriptive title
- Steps to reproduce (including environment details)
- Expected vs actual behavior
- Screenshots or logs if applicable

### 💡 Suggest a Feature

Have an idea? [Open a feature request](https://github.com/tipchain/tipchain/issues/new?template=feature_request.md) with:

- A clear description of the problem you're solving
- Your proposed solution
- Any alternatives you've considered
- How this benefits the TipChain community

### 📝 Improve Documentation

Documentation improvements are always welcome! Feel free to:

- Fix typos or broken links
- Add examples and code snippets
- Write guides for self-hosting, plugins, or SDK usage
- Translate documentation into other languages

### 🧪 Submit Code

#### 1. Find or Create an Issue

Check our [open issues](https://github.com/tipchain/tipchain/issues), especially the [good first issue](https://github.com/tipchain/tipchain/labels/good%20first%20issue) and [help wanted](https://github.com/tipchain/tipchain/labels/help%20wanted) labels. Comment on the issue to let everyone know you're working on it.

#### 2. Fork & Branch

```bash
git clone https://github.com/your-username/tipchain.git
cd tipchain
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bugfix-name
```

**Branch naming conventions:**
- `feat/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation changes
- `refactor/` — Code refactoring
- `chore/` — Build process, dependencies, etc.

#### 3. Set Up Development Environment

```bash
npm install
cp .env.example .env
npm run dev
```

#### 4. Make Your Changes

- Write clean, readable code that follows the project's style
- Add or update tests as needed
- Update documentation if you're changing behavior
- Keep changes focused — one change per PR

#### 5. Run Tests & Lint

```bash
npm run lint          # Check code style
npm run typecheck     # TypeScript type checking
npm run test          # Run tests
```

#### 6. Commit Your Changes

We use conventional commits:

```
feat(creators): add organization account support
fix(dashboard): correct earnings calculation for USDC tips
docs: update self-hosting guide with Fly.io instructions
```

**Format:** `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

#### 7. Open a Pull Request

- Push to your fork and [open a PR](https://github.com/tipchain/tipchain/compare) against `main`
- Fill out the PR template with details about your changes
- Link any related issues

#### 8. Code Review

A maintainer will review your PR. They may ask for changes — don't be discouraged! This is a normal and collaborative process.

## Development Guidelines

### Project Structure

```
tipchain/
├── apps/web/           # Next.js frontend
├── backend/            # Express API server
├── packages/           # Shared packages
│   ├── ui/             # React components
│   ├── sdk/            # JavaScript SDK
│   ├── solana/         # Solana utilities
│   └── ...
├── programs/           # Anchor programs
├── cli/                # CLI tool
└── plugins/            # Plugin marketplace
```

### Code Style

- **TypeScript** — Strict mode, no `any` types
- **React** — Functional components with hooks
- **TailwindCSS** — Utility-first, use `cn()` from `@/lib/utils`
- **Prisma** — Use transactions for multi-step database operations
- **Zod** — Validate all API inputs

### Testing

- **Frontend**: Vitest + React Testing Library
- **Backend**: Vitest + Supertest for API tests
- **Solana**: Anchor test framework with Bankrun

### Pull Request Checklist

- [ ] Code follows the project's style guidelines
- [ ] TypeScript compiles without errors
- [ ] Tests pass and coverage isn't reduced
- [ ] Documentation is updated (if applicable)
- [ ] Changes are backward-compatible or clearly documented migration path
- [ ] PR title follows conventional commits format
- [ ] Changes include appropriate error handling

## 🏆 Recognition

Contributors are recognized in our:

- **README Contributors section** — every merged PR
- **Release notes** — shoutouts for significant contributions
- **Hall of Fame** — long-term contributors and maintainers

## 🤔 Questions?

- 💬 Join our [Discord](https://discord.gg/tipchain)
- 🐦 Tweet at [@tipchain](https://twitter.com/tipchain)
- 📧 Email: hello@tipchain.dev

---

*TipChain is community-driven. We're building this together. Thank you for being part of it.*
