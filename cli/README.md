# @tipchain/cli

> TipChain CLI — deploy, manage, and monitor your creator monetization platform.

## Installation

```bash
npm install -g @tipchain/cli
# or
npx @tipchain/cli --help
```

## Commands

| Command | Description |
|---------|-------------|
| `tipchain init` | Initialize a new TipChain deployment |
| `tipchain deploy` | Deploy to production (Railway, Render, Vercel) |
| `tipchain sync` | Sync on-chain data with your database |
| `tipchain creator create` | Create a creator profile |
| `tipchain analytics` | View creator analytics |
| `tipchain plugin install` | Install a plugin |
| `tipchain plugin list` | List installed plugins |
| `tipchain doctor` | Diagnose deployment health |

## Examples

```bash
# Initialize a new deployment
tipchain init --dir ./my-tipchain --template docker

# Create a creator
tipchain creator create \
  --wallet 9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r \
  --username rahul \
  --bio "Full-stack developer & Solana enthusiast"

# Install a plugin
tipchain plugin install nft-rewards

# Check deployment health
tipchain doctor
```
