import { Router, Request, Response } from "express";

const router = Router();

// SDK documentation metadata endpoint
router.get("/api/sdk/info", (_req: Request, res: Response) => {
  res.json({
    name: "@tipchain/sdk",
    version: "1.0.0",
    description: "Official TipChain SDK for TypeScript/JavaScript",
    repository: "https://github.com/tipchain/tipchain",
    packages: [
      {
        name: "@tipchain/sdk",
        description: "Core SDK client",
        docsUrl: "/api/sdk/docs/client",
      },
      {
        name: "@tipchain/react-hooks",
        description: "React hooks for TipChain",
        docsUrl: "/api/sdk/docs/react",
      },
      {
        name: "@tipchain/webhooks",
        description: "Webhook utilities",
        docsUrl: "/api/sdk/docs/webhooks",
      },
      {
        name: "@tipchain/plugins",
        description: "Plugin system",
        docsUrl: "/api/sdk/docs/plugins",
      },
    ],
    quickStart: {
      install: "npm install @tipchain/sdk",
      usage: `
import { TipChain } from '@tipchain/sdk';

const client = new TipChain({
  apiKey: 'tc_your_api_key_here',
});

// Get creator profile
const creator = await client.creators.get('wallet_address');

// Send a tip
const tip = await client.tips.send({
  sender: 'sender_wallet',
  receiver: 'receiver_wallet',
  amount: 0.1,
  token: 'SOL',
});

// Get analytics
const analytics = await client.analytics.overview('wallet_address');
      `.trim(),
    },
  });
});

// Full API Reference endpoint
router.get("/api/sdk/reference", (_req: Request, res: Response) => {
  res.json({
    baseUrl: "http://localhost:4000",
    endpoints: [
      {
        group: "Creators",
        endpoints: [
          { method: "GET", path: "/api/v1/creators", description: "List all creators" },
          { method: "GET", path: "/api/v1/creators/search", description: "Search creators" },
          { method: "GET", path: "/api/v1/creators/featured", description: "Get featured creators" },
          { method: "GET", path: "/api/v1/creators/trending", description: "Get trending creators" },
          { method: "GET", path: "/api/v1/creator/:wallet", description: "Get creator by wallet" },
          { method: "GET", path: "/api/v1/creator/by-username/:username", description: "Get creator by username" },
          { method: "POST", path: "/api/v1/creator", description: "Create creator profile" },
          { method: "PUT", path: "/api/v1/creator/:wallet", description: "Update creator profile" },
        ],
      },
      {
        group: "Tips",
        endpoints: [
          { method: "POST", path: "/api/v1/tip/send", description: "Send a tip (SOL)" },
          { method: "POST", path: "/api/v1/tip/spl", description: "Send a tip (SPL token)" },
          { method: "GET", path: "/api/v1/tip/history", description: "Get tip history" },
          { method: "GET", path: "/api/v1/transactions/:wallet", description: "Get wallet transactions" },
        ],
      },
      {
        group: "Leaderboard & Analytics",
        endpoints: [
          { method: "GET", path: "/api/v1/leaderboard", description: "Top supporters" },
          { method: "GET", path: "/api/v1/analytics/:wallet/overview", description: "Analytics overview" },
          { method: "GET", path: "/api/v1/analytics/:wallet/revenue", description: "Revenue data (30d)" },
          { method: "GET", path: "/api/v1/analytics/:wallet/tips", description: "Tip analytics" },
          { method: "GET", path: "/api/v1/analytics/:wallet/growth", description: "Growth metrics" },
          { method: "GET", path: "/api/v1/analytics/:wallet/export", description: "Export CSV" },
        ],
      },
      {
        group: "Memberships",
        endpoints: [
          { method: "GET", path: "/api/v1/memberships/:wallet", description: "Get tiers" },
          { method: "POST", path: "/api/v1/memberships", description: "Create tier" },
          { method: "POST", path: "/api/v1/memberships/subscribe", description: "Subscribe to tier" },
          { method: "GET", path: "/api/v1/memberships/my/:wallet", description: "My subscriptions" },
        ],
      },
      {
        group: "Badges & Social",
        endpoints: [
          { method: "GET", path: "/api/v1/badges", description: "All badges" },
          { method: "POST", path: "/api/v1/badges/award", description: "Award badge" },
          { method: "GET", path: "/api/v1/referrals/:wallet", description: "Referral stats" },
          { method: "POST", path: "/api/v1/referrals", description: "Create referral code" },
        ],
      },
      {
        group: "Developer API Keys",
        endpoints: [
          { method: "GET", path: "/api/v1/api-keys", description: "List API keys" },
          { method: "POST", path: "/api/v1/api-keys", description: "Create API key" },
          { method: "DELETE", path: "/api/v1/api-keys/:id", description: "Delete API key" },
          { method: "PATCH", path: "/api/v1/api-keys/:id/toggle", description: "Toggle API key" },
        ],
      },
      {
        group: "Solana Actions (Blinks)",
        endpoints: [
          { method: "GET", path: "/api/actions/creator/:wallet", description: "Creator tip action metadata" },
          { method: "POST", path: "/api/actions/creator/:wallet/tip", description: "Execute tip action" },
          { method: "GET", path: "/api/actions/membership/:wallet/:tierId", description: "Membership action metadata" },
          { method: "POST", path: "/api/actions/membership/:wallet/:tierId/subscribe", description: "Execute membership action" },
        ],
      },
      {
        group: "Jupiter Swap",
        endpoints: [
          { method: "GET", path: "/api/swap/quote", description: "Get swap quote" },
          { method: "POST", path: "/api/swap/instructions", description: "Get swap instructions" },
          { method: "GET", path: "/api/swap/tokens", description: "Search tokens" },
        ],
      },
      {
        group: "DAO & Organizations",
        endpoints: [
          { method: "POST", path: "/api/v1/dao", description: "Create DAO" },
          { method: "GET", path: "/api/v1/dao/:wallet", description: "List DAOs" },
          { method: "POST", path: "/api/v1/dao/distribute", description: "Distribute tips via DAO" },
          { method: "POST", path: "/api/v1/dao/member", description: "Add DAO member" },
        ],
      },
      {
        group: "GraphQL",
        endpoints: [
          { method: "POST", path: "/api/graphql", description: "GraphQL query endpoint" },
        ],
      },
      {
        group: "Webhooks",
        endpoints: [
          { method: "GET", path: "/api/v1/webhook/:wallet", description: "Get webhooks" },
          { method: "POST", path: "/api/v1/webhook/register", description: "Register webhook" },
          { method: "DELETE", path: "/api/v1/webhook/:id", description: "Delete webhook" },
        ],
      },
      {
        group: "Notifications",
        endpoints: [
          { method: "GET", path: "/api/v1/notifications/:wallet", description: "Get notifications" },
          { method: "PUT", path: "/api/v1/notifications/:id/read", description: "Mark read" },
          { method: "PUT", path: "/api/v1/notifications/read-all/:wallet", description: "Mark all read" },
        ],
      },
      {
        group: "Admin",
        endpoints: [
          { method: "GET", path: "/api/v1/admin/analytics", description: "Platform analytics" },
          { method: "GET", path: "/api/v1/admin/health", description: "System health" },
          { method: "PUT", path: "/api/v1/admin/creators/:wallet/verify", description: "Verify creator" },
        ],
      },
    ],
  });
});

export default router;
