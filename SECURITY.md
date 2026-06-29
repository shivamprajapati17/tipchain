# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the latest stable release.

| Version | Supported          |
| ------- | ------------------ |
| >= 1.0.0 | ✅ Supported       |
| < 1.0.0  | ❌ Not supported   |

## Reporting a Vulnerability

**Please do not file a public GitHub issue for security vulnerabilities.**

TipChain takes security seriously. If you discover a security vulnerability, please report it privately by emailing **security@tipchain.dev** or by using the GitHub Security Advisory ["Report a Vulnerability"](https://github.com/tipchain/tipchain/security/advisories/new) tab.

You should receive a response within 48 hours. If the issue is confirmed, a patch will be released as soon as possible, coordinated with the disclosure timeline.

### What to include

- Type of vulnerability (e.g., SQL injection, cross-site scripting, broken authentication)
- Full paths of source file(s) related to the issue
- Step-by-step reproduction instructions
- Proof-of-concept or exploit code (if applicable)
- Impact description

## Scope

Security vulnerabilities in:

- The TipChain web application (`apps/web`)
- The TipChain API server (`backend/`)
- Solana smart contracts (`programs/`)
- The TipChain CLI (`cli/`)
- Official packages (`packages/`)

## Out of Scope

- Issues in dependencies — please report to the respective maintainer
- Best-practice recommendations without demonstrated exploit
- Feature requests or general bugs (open a regular issue for these)

## Responsible Disclosure

We will:

1. Acknowledge receipt of your report within 48 hours
2. Confirm the vulnerability and determine its impact
3. Release a patch within a reasonable timeframe
4. Credit you in the release notes (if you wish)

## Bug Bounty

We do not currently operate a paid bug bounty program. Security researchers who report valid vulnerabilities will be acknowledged in our Hall of Fame.

## Smart Contract Security

TipChain's Solana programs undergo professional audits before mainnet deployment. We use:

- [Anchor](https://www.anchor-lang.com/) framework for safe program development
- [Trident](https://ackee.xyz/trident/) fuzzer for automated testing
- Manual code review by Solana security engineers

---

*TipChain is open-source infrastructure for creator monetization. Help us keep it safe.*
