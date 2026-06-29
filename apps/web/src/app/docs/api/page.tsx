"use client";

import { Copy, Check, Terminal, ArrowRight, Code, Gear, Database, Lock, Plugs, Link as LinkIcon } from "@phosphor-icons/react";
import { useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════════════════════════

const ENDPOINT_GROUPS = [
  {
    title: "CREATORS",
    icon: "U",
    endpoints: [
      { method: "GET", path: "/creators", description: "List all creators", auth: false },
      { method: "GET", path: "/creators/search?q=&category=&sort=&limit=&offset=", description: "Search creators with filters", auth: false },
      { method: "GET", path: "/creator/:wallet", description: "Get creator by wallet address", auth: false },
      { method: "GET", path: "/creator/by-username/:username", description: "Get creator by username", auth: false },
      { method: "POST", path: "/creator", description: "Create a new creator profile", auth: true },
      { method: "PUT", path: "/creator/:wallet", description: "Update creator profile", auth: true },
    ],
  },
  {
    title: "TRANSACTIONS",
    icon: "T",
    endpoints: [
      { method: "GET", path: "/transactions", description: "List all transactions", auth: false },
      { method: "GET", path: "/transactions/:wallet?limit=", description: "Get transactions for a wallet", auth: false },
      { method: "POST", path: "/transaction", description: "Record a new transaction", auth: true },
    ],
  },
  {
    title: "ANALYTICS",
    icon: "A",
    endpoints: [
      { method: "GET", path: "/analytics/:wallet/overview", description: "Dashboard overview with earnings and stats", auth: true },
      { method: "GET", path: "/analytics/:wallet/revenue?days=", description: "Revenue chart data (default: 30 days)", auth: true },
      { method: "GET", path: "/analytics/:wallet/tips", description: "Tip analytics breakdown", auth: true },
      { method: "GET", path: "/analytics/:wallet/growth", description: "Growth metrics (followers, supporters)", auth: true },
      { method: "GET", path: "/analytics/:wallet/export?days=", description: "Export transaction data as CSV", auth: true },
    ],
  },
  {
    title: "LEADERBOARD",
    icon: "L",
    endpoints: [
      { method: "GET", path: "/leaderboard?limit=", description: "Get supporter leaderboard (default: 25)", auth: false },
    ],
  },
  {
    title: "BADGES",
    icon: "B",
    endpoints: [
      { method: "GET", path: "/badges", description: "List all badge types and requirements", auth: false },
      { method: "GET", path: "/badges/supporter/:wallet", description: "Get badges awarded to a wallet", auth: false },
      { method: "POST", path: "/badges/award", description: "Award a badge to a supporter (admin)", auth: true },
    ],
  },
  {
    title: "MEMBERSHIPS",
    icon: "M",
    endpoints: [
      { method: "GET", path: "/memberships/:wallet", description: "Get creator's membership tiers", auth: false },
      { method: "POST", path: "/memberships", description: "Create a membership tier", auth: true },
      { method: "PUT", path: "/memberships/:id", description: "Update a membership tier", auth: true },
      { method: "DELETE", path: "/memberships/:id", description: "Delete a membership tier", auth: true },
      { method: "POST", path: "/memberships/subscribe", description: "Subscribe to a membership tier", auth: true },
      { method: "GET", path: "/memberships/my/:wallet", description: "Get active subscriptions for a wallet", auth: true },
    ],
  },
  {
    title: "SOCIAL",
    icon: "S",
    endpoints: [
      { method: "POST", path: "/follow", description: "Follow a creator", auth: true },
      { method: "DELETE", path: "/follow/:follower/:creator", description: "Unfollow a creator", auth: true },
      { method: "GET", path: "/follow/:wallet/followers", description: "Get followers of a creator", auth: false },
      { method: "GET", path: "/follow/:wallet/following", description: "Get who a wallet follows", auth: false },
      { method: "POST", path: "/comments", description: "Add a comment to a creator profile", auth: true },
      { method: "GET", path: "/comments/:wallet", description: "Get comments on a creator profile", auth: false },
      { method: "POST", path: "/updates", description: "Create a creator post/update", auth: true },
      { method: "GET", path: "/updates/:wallet", description: "Get creator updates", auth: false },
      { method: "GET", path: "/feed/:wallet", description: "Get following feed of updates", auth: true },
    ],
  },
  {
    title: "NOTIFICATIONS",
    icon: "N",
    endpoints: [
      { method: "GET", path: "/notifications/:wallet", description: "Get notifications for a wallet", auth: true },
      { method: "PUT", path: "/notifications/:id/read", description: "Mark a notification as read", auth: true },
      { method: "PUT", path: "/notifications/read-all/:wallet", description: "Mark all notifications as read", auth: true },
    ],
  },
  {
    title: "REFERRALS",
    icon: "R",
    endpoints: [
      { method: "GET", path: "/referrals/:wallet", description: "Get referral stats for creator", auth: true },
      { method: "POST", path: "/referrals", description: "Create a referral code", auth: true },
      { method: "GET", path: "/referrals/code/:code", description: "Track a referral code click", auth: false },
    ],
  },
  {
    title: "ADMIN",
    icon: "X",
    endpoints: [
      { method: "GET", path: "/admin/analytics", description: "Platform-wide analytics", auth: true },
      { method: "GET", path: "/admin/creators", description: "List all creators (admin view)", auth: true },
      { method: "GET", path: "/admin/users", description: "List all users (admin view)", auth: true },
      { method: "PUT", path: "/admin/creators/:wallet/verify", description: "Verify/unverify a creator", auth: true },
      { method: "PUT", path: "/admin/creators/:wallet/feature", description: "Feature/unfeature a creator", auth: true },
      { method: "GET", path: "/admin/health", description: "System health check", auth: false },
    ],
  },
  {
    title: "CATEGORIES",
    icon: "C",
    endpoints: [
      { method: "GET", path: "/categories", description: "List all creator categories", auth: false },
      { method: "GET", path: "/creators/trending", description: "Get trending creators", auth: false },
      { method: "GET", path: "/creators/featured", description: "Get featured creators", auth: false },
      { method: "GET", path: "/creators/recent", description: "Get recently joined creators", auth: false },
      { method: "GET", path: "/creators/recommended", description: "Get recommended creators for a wallet", auth: false },
    ],
  },
];

const API_CLIENT_CODE = `import { TipChainAPI } from "@tipchain/api";

// Initialize the API client
const api = new TipChainAPI("https://api.tipchain.dev/v1", {
  apiKey: "your_api_key",
});

// List all creators
const { creators } = await api.creators.list({ sort: "earnings" });

// Get a specific creator
const creator = await api.creators.get("username");

// Create a creator profile
const newCreator = await api.creators.create({
  walletAddress: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
  username: "rahul",
  bio: "Full-stack developer & Solana enthusiast",
});

// List transactions
const { transactions } = await api.transactions.list(walletAddress);

// Create a transaction record
const tx = await api.transactions.create({
  senderWallet: "...",
  receiverWallet: "...",
  amount: 1.0,
  token: "SOL",
  txHash: "5KtPn1...",
  message: "Great work!",
});

// Get analytics
const { overview } = await api.analytics.overview(walletAddress);
const { revenue } = await api.analytics.revenue(walletAddress, 30);`;

const CURL_EXAMPLES = [
  {
    title: "LIST CREATORS",
    cmd: `curl -X GET "https://api.tipchain.dev/v1/creators"`,
    desc: "Fetch all creators",
  },
  {
    title: "GET CREATOR",
    cmd: `curl -X GET "https://api.tipchain.dev/v1/creator/by-username/rahul"`,
    desc: "Fetch a single creator by username",
  },
  {
    title: "CREATE CREATOR",
    cmd: `curl -X POST "https://api.tipchain.dev/v1/creator" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer tc_your_api_key" \\
  -d '{
    "walletAddress": "9xJ4mM3z...",
    "username": "rahul",
    "bio": "Full-stack developer"
  }'`,
    desc: "Create a new creator profile",
  },
  {
    title: "RECORD TX",
    cmd: `curl -X POST "https://api.tipchain.dev/v1/transaction" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer tc_your_api_key" \\
  -d '{
    "senderWallet": "9xJ4mM3z...",
    "receiverWallet": "8yK2nN4a...",
    "amount": 1.5,
    "token": "SOL",
    "message": "Thanks!"
  }'`,
    desc: "Record a transaction",
  },
  {
    title: "GET ANALYTICS",
    cmd: `curl -X GET "https://api.tipchain.dev/v1/analytics/9xJ4mM3z.../overview" \\
  -H "Authorization: Bearer tc_your_api_key"`,
    desc: "Get dashboard analytics",
  },
];

const ERROR_CODES = [
  { code: 400, name: "BAD_REQUEST", description: "Invalid request body or parameters" },
  { code: 401, name: "UNAUTHORIZED", description: "Missing or invalid API key / wallet signature" },
  { code: 403, name: "FORBIDDEN", description: "Wallet does not own the resource" },
  { code: 404, name: "NOT_FOUND", description: "Creator, transaction, or resource not found" },
  { code: 409, name: "CONFLICT", description: "Username already taken or duplicate resource" },
  { code: 429, name: "RATE_LIMITED", description: "Too many requests. Retry after the specified interval" },
  { code: 500, name: "INTERNAL_ERROR", description: "Server error. Contact support if persistent" },
];

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2 py-1 border border-[#D4D4D0] bg-[#F9F9F7] hover:bg-[#F0F0EC] transition-colors text-[10px] tracking-[0.08em] text-[#888888]"
    >
      {copied ? (
        <><Check className="size-3 text-[#059669]" weight="bold" /> COPIED</>
      ) : (
        <><Copy className="size-3" weight="bold" /> COPY</>
      )}
    </button>
  );
}

function CodeBlock({ code, lang = "typescript" }: { code: string; lang?: string }) {
  return (
    <div className="relative border border-[#D4D4D0] bg-[#F9F9F7]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#D4D4D0] bg-[#F4F4F0]">
        <span className="text-[10px] tracking-[0.1em] text-[#888888] uppercase">[ {lang} ]</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-[#111111]">{code}</pre>
    </div>
  );
}

function HazardDivider() {
  return (
    <div
      className="h-[2px] my-0"
      style={{
        background: "repeating-linear-gradient(90deg, #059669 0px, #059669 6px, transparent 6px, transparent 12px)",
      }}
    />
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    GET: { bg: "#F0FDF4", text: "#059669", border: "#059669" },
    POST: { bg: "#EFF6FF", text: "#2563EB", border: "#2563EB" },
    PUT: { bg: "#FFF7ED", text: "#EA580C", border: "#EA580C" },
    DELETE: { bg: "#FEF2F2", text: "#DC2626", border: "#DC2626" },
  };
  const style = colors[method] ?? { bg: "#F4F4F0", text: "#888888", border: "#D4D4D0" };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-[0.05em] shrink-0"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {method}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <div className="h-[3px]" style={{ background: "repeating-linear-gradient(90deg, #059669 0px, #059669 10px, transparent 10px, transparent 20px)" }} />
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-4 text-[#888888] block">
          REST API // V1
        </samp>
        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-8 lg:p-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[0.9] text-[#111111] uppercase mb-6">
              API <span className="text-[#059669]">INTEGRATION</span>
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-[#888888] tracking-[0.02em] mb-8">
              REST API REFERENCE AND INTEGRATION GUIDE FOR THE TIPCHAIN PLATFORM.
              TYPE-SAFE CLIENT LIBRARIES, CURL EXAMPLES, FULL ENDPOINT DOCUMENTATION,
              AND ERROR HANDLING.
            </p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Database className="size-4 text-[#059669]" weight="bold" />
                  <span className="text-xs tracking-[0.05em] text-[#888888]">REST</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Gear className="size-4 text-[#059669]" weight="bold" />
                  <span className="text-xs tracking-[0.05em] text-[#888888]">TypeScript Client</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Lock className="size-4 text-[#059669]" weight="bold" />
                  <span className="text-xs tracking-[0.05em] text-[#888888]">Wallet Auth</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GettingStartedSection() {
  const BASE_EXAMPLES = [
    { label: "PRODUCTION", url: "https://api.tipchain.dev/v1" },
    { label: "STAGING", url: "https://api.staging.tipchain.dev/v1" },
    { label: "DEVELOPMENT", url: "http://localhost:4000" },
  ];

  return (
    <section className="border-b border-[#D4D4D0]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          BASICS
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          GETTING STARTED
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-6 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold text-[#111111] mb-4 uppercase tracking-[0.05em]">
                  Base URLs
                </h3>
                <div className="border border-[#D4D4D0] divide-y divide-[#D4D4D0]">
                  {BASE_EXAMPLES.map((env) => (
                    <div key={env.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs font-bold text-[#111111]">{env.label}</span>
                      <code className="text-xs text-[#059669] font-mono">{env.url}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111] mb-4 uppercase tracking-[0.05em]">
                  Authentication
                </h3>
                <div className="border border-[#D4D4D0] p-4 bg-[#F9F9F7] h-full flex flex-col justify-center">
                  <p className="text-xs text-[#888888] leading-relaxed mb-3">
                    Protected endpoints require an API key passed via the Authorization header:
                  </p>
                  <code className="block text-xs text-[#059669] font-mono bg-[#F0FDF4] px-3 py-2 border border-[#059669]">
                    Authorization: Bearer tc_your_api_key
                  </code>
                  <p className="text-[10px] text-[#9CA3AF] mt-3 leading-relaxed">
                    Obtain an API key by connecting your wallet and generating one from
                    the dashboard settings panel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClientLibrarySection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          CLIENT
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          @tipchain/api — TypeScript Client
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-6 lg:p-8">
            <p className="text-xs text-[#888888] leading-relaxed mb-6">
              THE <code className="text-[#059669] font-bold">@tipchain/api</code> PACKAGE PROVIDES A TYPE-SAFE
              REST CLIENT FOR THE TIPCHAIN PLATFORM. IT HANDLES AUTHENTICATION, REQUEST
              SERIALIZATION, AND ERROR PARSING AUTOMATICALLY.
            </p>

            <div className="mb-4">
              <p className="text-[10px] text-[#9CA3AF] mb-2">INSTALL</p>
              <div className="border border-[#D4D4D0] bg-[#F9F9F7]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#D4D4D0] bg-[#F4F4F0]">
                  <span className="text-[10px] tracking-[0.1em] text-[#888888] uppercase">[ terminal ]</span>
                  <CopyButton text="npm install @tipchain/api" />
                </div>
                <pre className="p-4 text-xs text-[#111111]">
                  <span className="text-[#9CA3AF]">$ </span>npm install @tipchain/api
                </pre>
              </div>
            </div>

            <p className="text-xs text-[#888888] leading-relaxed mb-4">USAGE EXAMPLE:</p>

            <CodeBlock code={API_CLIENT_CODE} lang="typescript" />

            <div className="mt-4 border border-[#059669] bg-[#F0FDF4] p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center size-5 border border-[#059669] bg-white text-[10px] font-bold text-[#059669] shrink-0 mt-0.5">i</span>
                <p className="text-[10px] text-[#059669] leading-relaxed">
                  THE <code className="font-bold">@tipchain/api</code> CLIENT IS FULLY TYPED WITH
                  COMPLETE TypeScript DEFINITIONS FOR ALL REQUEST AND RESPONSE TYPES.
                  USE IT AS A LIGHTER ALTERNATIVE TO THE FULL SDK WHEN YOU ONLY NEED
                  REST API ACCESS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EndpointSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          REFERENCE
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          ENDPOINTS
        </h2>

        <div className="space-y-6">
          {ENDPOINT_GROUPS.map((group) => (
            <div key={group.title} className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center size-8 border border-[#D4D4D0] bg-[#F9F9F7] text-xs font-bold text-[#059669]">
                    {group.icon}
                  </div>
                  <h3 className="text-sm font-bold text-[#111111] tracking-[-0.02em] uppercase">
                    {group.title}
                  </h3>
                  <span className="text-[10px] text-[#9CA3AF]">({group.endpoints.length} routes)</span>
                </div>

                <div className="border border-[#D4D4D0] divide-y divide-[#D4D4D0]">
                  {group.endpoints.map((ep) => (
                    <div key={ep.path} className="flex items-center gap-4 px-4 py-3 hover:bg-[#F9F9F7] transition-colors">
                      <MethodBadge method={ep.method} />
                      <code className="flex-1 text-xs text-[#111111] font-mono break-all">
                        {ep.path}
                      </code>
                      <span className="text-xs text-[#888888] hidden lg:block max-w-xs truncate">{ep.description}</span>
                      {ep.auth ? (
                        <Lock className="size-3 text-[#9CA3AF] shrink-0" weight="bold" />
                      ) : (
                        <span className="text-[10px] text-[#9CA3AF] shrink-0">public</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CurlSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          EXAMPLES
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          CURL EXAMPLES
        </h2>

        <div className="space-y-4">
          {CURL_EXAMPLES.map((example) => (
            <div key={example.title} className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Terminal className="size-4 text-[#059669]" weight="bold" />
                    <h3 className="text-sm font-bold text-[#111111] uppercase tracking-[0.03em]">{example.title}</h3>
                  </div>
                  <span className="text-[10px] text-[#9CA3AF]">{example.desc}</span>
                </div>

                <div className="border border-[#D4D4D0] bg-[#F9F9F7]">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-[#D4D4D0] bg-[#F4F4F0]">
                    <span className="text-[10px] tracking-[0.1em] text-[#888888] uppercase">[ curl ]</span>
                    <CopyButton text={example.cmd} />
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-[#111111]">{example.cmd}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResponseSchemaSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          SCHEMA
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          RESPONSE FORMAT
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="p-6 lg:p-8">
            <h3 className="text-xs font-bold text-[#111111] mb-4 uppercase tracking-[0.05em]">
              Standard Response
            </h3>
            <CodeBlock code={`// Successful response
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-15T10:30:00Z"
}

// List response (paginated)
{
  "success": true,
  "data": [ ... ],
  "timestamp": "2025-01-15T10:30:00Z"
}`} lang="json" />
          </div>
          <div className="p-6 lg:p-8">
            <h3 className="text-xs font-bold text-[#111111] mb-4 uppercase tracking-[0.05em]">
              Error Response
            </h3>
            <CodeBlock code={`// Error response
{
  "success": false,
  "error": "Creator not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-01-15T10:30:00Z"
}

// Validation error
{
  "success": false,
  "error": "Validation failed",
  "code": "BAD_REQUEST",
  "details": {
    "username": "Username already taken"
  }
}`} lang="json" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ErrorCodesSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          ERRORS
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          ERROR CODES
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-6 lg:p-8">
            <p className="text-xs text-[#888888] leading-relaxed mb-6">
              ALL API ERRORS RETURN A STANDARD JSON RESPONSE WITH AN HTTP STATUS CODE,
              MACHINE-READABLE ERROR CODE, AND HUMAN-READABLE DESCRIPTION.
            </p>

            <div className="border border-[#D4D4D0] divide-y divide-[#D4D4D0]">
              <div className="flex items-center px-4 py-3 bg-[#F4F4F0]">
                <span className="w-20 text-[10px] font-bold tracking-[0.1em] text-[#888888] uppercase">Code</span>
                <span className="w-36 text-[10px] font-bold tracking-[0.1em] text-[#888888] uppercase">Name</span>
                <span className="flex-1 text-[10px] font-bold tracking-[0.1em] text-[#888888] uppercase">Description</span>
              </div>
              {ERROR_CODES.map((err) => (
                <div key={err.code} className="flex items-center px-4 py-3 hover:bg-[#F9F9F7] transition-colors">
                  <span className="w-20 text-xs font-bold text-[#DC2626] font-mono">{err.code}</span>
                  <span className="w-36 text-xs font-bold text-[#111111] font-mono">{err.name}</span>
                  <span className="flex-1 text-xs text-[#888888]">{err.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WebhookSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          EVENTS
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          WEBHOOKS
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-6 lg:p-8">
            <p className="text-xs text-[#888888] leading-relaxed mb-6">
              TIPCHAIN SUPPORTS OUTGOING WEBHOOKS FOR REAL-TIME EVENT NOTIFICATIONS.
              CONFIGURE WEBHOOK URLs IN THE DASHBOARD TO RECEIVE POST REQUESTS WHEN
              SPECIFIC EVENTS OCCUR.
            </p>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-xs font-bold text-[#111111] mb-4 uppercase tracking-[0.05em]">
                  Supported Events
                </h3>
                <div className="border border-[#D4D4D0] divide-y divide-[#D4D4D0]">
                  {[
                    { event: "tip.received", desc: "A tip was sent to a creator" },
                    { event: "creator.created", desc: "A new creator profile was created" },
                    { event: "membership.activated", desc: "A user subscribed to a membership tier" },
                    { event: "badge.awarded", desc: "A badge was awarded to a supporter" },
                  ].map((ev) => (
                    <div key={ev.event} className="px-4 py-3">
                      <code className="block text-xs font-bold text-[#059669] mb-1">{ev.event}</code>
                      <p className="text-[10px] text-[#888888]">{ev.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111111] mb-4 uppercase tracking-[0.05em]">
                  Payload Format
                </h3>
                <CodeBlock code={`{
  "event": "tip.received",
  "data": {
    "id": "tx_abc123",
    "senderWallet": "...",
    "receiverWallet": "...",
    "amount": "0.5",
    "token": "SOL",
    "message": "Great work!",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}`} lang="json" />
              </div>
            </div>

            <div className="mt-6 border border-[#D4D4D0] bg-[#F9F9F7] p-4">
              <div className="flex items-start gap-3">
                <Plugs className="size-4 text-[#059669] shrink-0 mt-0.5" weight="bold" />
                <div>
                  <p className="text-[10px] font-bold text-[#059669] uppercase tracking-[0.05em] mb-1">Plugin System</p>
                  <p className="text-[10px] text-[#888888] leading-relaxed">
                    Webhooks are the foundation of the TipChain plugin architecture.
                    Plugins can hook into any event to extend platform functionality —
                    from NFT badge minting to Discord notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResourcesSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          RESOURCES
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          FURTHER READING
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {[
            { title: "SDK DOCS", desc: "Universal JavaScript SDK for building app integrations with TipChain.", href: "/docs/sdk", label: "SDK DOCS >>" },
            { title: "SOURCE CODE", desc: "Browse the API client source on GitHub. MIT licensed.", href: "https://github.com/shivamprajapati17/tipchain12", label: "GITHUB >>" },
            { title: "ARCHITECTURE", desc: "System architecture — backend, database, plugins, and Solana integration.", href: "/dashboard", label: "ARCHITECTURE >>" },
          ].map((resource) => (
            <div key={resource.title} className="p-6" style={{ background: "#FFFFFF" }}>
              <p className="text-[10px] tracking-[0.12em] text-[#059669] font-bold mb-3 uppercase">
                [ {resource.title} ]
              </p>
              <p className="text-[10px] text-[#888888] leading-relaxed mb-4">{resource.desc}</p>
              <a
                href={resource.href}
                target={resource.href.startsWith("http") ? "_blank" : undefined}
                rel={resource.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1 text-[10px] text-[#059669] font-bold tracking-[0.05em] hover:text-[#047857] transition-colors uppercase"
              >
                {resource.label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════

export default function APIPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="pt-16" /> {/* Header spacer */}
      <HeroSection />
      <GettingStartedSection />
      <ClientLibrarySection />
      <EndpointSection />
      <CurlSection />
      <ResponseSchemaSection />
      <ErrorCodesSection />
      <WebhookSection />
      <ResourcesSection />
    </div>
  );
}
