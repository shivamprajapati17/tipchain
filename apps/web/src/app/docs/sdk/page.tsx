"use client";

import { Copy, Check, Terminal, BookOpen, ArrowRight, Package, Code, Gear, ChartBar } from "@phosphor-icons/react";
import { useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════════════════════════

const MODULES = [
  {
    title: "CREATORS API",
    methods: [
      { signature: "client.creators.list(options?)", returns: "Promise<Creator[]>", description: "List all creators with optional search, category, sort, limit, and offset." },
      { signature: "client.creators.get(username)", returns: "Promise<CreatorDetail>", description: "Get a single creator by their username." },
      { signature: "client.creators.getByWallet(wallet)", returns: "Promise<CreatorDetail>", description: "Look up a creator by their Solana wallet address." },
      { signature: "client.creators.create(data)", returns: "Promise<{ creator: Creator }>", description: "Create a new creator profile. Requires walletAddress and username." },
      { signature: "client.creators.update(wallet, data)", returns: "Promise<{ creator: Creator }>", description: "Update an existing creator profile. Only the wallet owner can update." },
    ],
  },
  {
    title: "TIPS API",
    methods: [
      { signature: "client.tips.send(input)", returns: "Promise<{ transaction: TipResult }>", description: "Send a tip to a creator. Records transaction both on-chain and off-chain." },
      { signature: "client.tips.list(wallet?, limit?)", returns: "Promise<{ transactions: TipResult[] }>", description: "Get transaction history for a wallet. If no wallet provided, returns all." },
    ],
  },
  {
    title: "ANALYTICS API",
    methods: [
      { signature: "client.analytics.overview(wallet)", returns: "Promise<{ overview: AnalyticsOverview }>", description: "Get dashboard overview with total earnings, transactions, and supporter counts." },
      { signature: "client.analytics.revenue(wallet, days?)", returns: "Promise<{ revenue: RevenuePoint[] }>", description: "Get revenue chart data for the specified number of days (default: 30)." },
      { signature: "client.analytics.exportCSV(wallet, days?)", returns: "Promise<Response>", description: "Export transaction data as a CSV file for the specified period." },
    ],
  },
];

const INSTALL_EXAMPLES = [
  { label: "NPM", code: "npm install @tipchain/sdk" },
  { label: "PNPM", code: "pnpm add @tipchain/sdk" },
  { label: "BUN", code: "bun add @tipchain/sdk" },
  { label: "YARN", code: "yarn add @tipchain/sdk" },
];

const QUICKSTART_CODE = `import { TipChain } from "@tipchain/sdk";

// Initialize the client
const client = new TipChain({
  apiKey: "tc_your_api_key",
  environment: "production",
});

// Fetch a creator profile
const { creator } = await client.creators.get("username");
console.log(creator.displayName, "-", creator.totalTips);

// List top creators
const { creators } = await client.creators.list({
  sort: "earnings",
  limit: 20,
});

// Send a tip
const { transaction } = await client.tips.send({
  to: creator.walletAddress,
  amount: 0.5,
  token: "SOL",
  message: "Great work!",
});

// Fetch analytics
const { overview } = await client.analytics.overview(creator.walletAddress);
console.log("Total earnings:", overview.totalEarnings);`;

const CONFIG_TABLE = [
  { option: "apiKey", type: "string", default: '""', description: "API key for authenticated requests. Required for production." },
  { option: "environment", type: '"production" | "staging" | "development"', default: '"production"', description: "Target environment. Auto-selects the base URL." },
  { option: "baseUrl", type: "string", default: "Auto-detected", description: "Custom base URL for self-hosted instances. Overrides environment." },
];

const ENVIRONMENTS = [
  { name: "Production", url: "https://api.tipchain.dev/v1" },
  { name: "Staging", url: "https://api.staging.tipchain.dev/v1" },
  { name: "Development", url: "http://localhost:4000" },
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

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <div className="h-[3px]" style={{ background: "repeating-linear-gradient(90deg, #059669 0px, #059669 10px, transparent 10px, transparent 20px)" }} />
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-4 text-[#888888] block">
          PACKAGE // V2.0.1
        </samp>
        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-8 lg:p-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[0.9] text-[#111111] uppercase mb-6">
              <span className="text-[#059669]">@tipchain</span>/sdk
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-[#888888] tracking-[0.02em] mb-8">
              UNIVERSAL JAVASCRIPT SDK FOR INTEGRATING TIPCHAIN INTO YOUR APPLICATION.
              SUPPORTS BOTH BROWSER AND NODE.JS ENVIRONMENTS. TYPE-SAFE, FULLY TYPED,
              AND OPTIMIZED FOR THE SOLANA ECOSYSTEM.
            </p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Package className="size-4 text-[#059669]" weight="bold" />
                  <span className="text-xs tracking-[0.05em] text-[#888888]">npm</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Gear className="size-4 text-[#059669]" weight="bold" />
                  <span className="text-xs tracking-[0.05em] text-[#888888]">TypeScript</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <ChartBar className="size-4 text-[#059669]" weight="bold" />
                  <span className="text-xs tracking-[0.05em] text-[#888888]">Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InstallationSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="border-b border-[#D4D4D0]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          SETUP
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          INSTALLATION
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-6 lg:p-8">
            <div className="flex flex-wrap gap-1 mb-6">
              {INSTALL_EXAMPLES.map((ex, i) => (
                <button
                  key={ex.label}
                  onClick={() => setActiveTab(i)}
                  className={`px-3 py-1.5 text-xs font-bold tracking-[0.1em] transition-colors ${
                    activeTab === i
                      ? "bg-[#059669] text-white"
                      : "bg-[#F9F9F7] text-[#888888] hover:bg-[#F0F0EC] border border-[#D4D4D0]"
                  }`}
                >
                  $ {ex.label}
                </button>
              ))}
            </div>

            <div className="border border-[#D4D4D0] bg-[#F9F9F7]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#D4D4D0] bg-[#F4F4F0]">
                <span className="text-[10px] tracking-[0.1em] text-[#888888] uppercase">[ terminal ]</span>
                <CopyButton text={INSTALL_EXAMPLES[activeTab].code} />
              </div>
              <pre className="p-4 text-xs leading-relaxed text-[#111111] font-mono">
                <span className="text-[#9CA3AF]">$ </span>{INSTALL_EXAMPLES[activeTab].code}
              </pre>
            </div>

            <div className="mt-4 border border-[#059669] bg-[#F0FDF4] p-4">
              <p className="text-[10px] tracking-[0.05em] text-[#059669] font-medium">
                REQUIREMENTS: NODE.JS &gt;= 18.0.0, TYPESCRIPT &gt;= 4.5 (RECOMMENDED)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConfigurationSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          CONFIG
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          CLIENT CONFIGURATION
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-6 lg:p-8">
            <p className="text-xs text-[#888888] leading-relaxed mb-6">
              The <code className="text-[#059669] font-bold">TipChain</code> client accepts a configuration object
              with the following options:
            </p>

            <div className="border border-[#D4D4D0] divide-y divide-[#D4D4D0]">
              <div className="flex items-center px-4 py-3 bg-[#F4F4F0]">
                <span className="w-28 text-[10px] font-bold tracking-[0.1em] text-[#888888] uppercase">Option</span>
                <span className="w-44 text-[10px] font-bold tracking-[0.1em] text-[#888888] uppercase">Type</span>
                <span className="w-24 text-[10px] font-bold tracking-[0.1em] text-[#888888] uppercase">Default</span>
                <span className="flex-1 text-[10px] font-bold tracking-[0.1em] text-[#888888] uppercase">Description</span>
              </div>
              {CONFIG_TABLE.map((row) => (
                <div key={row.option} className="flex items-center px-4 py-3 hover:bg-[#F9F9F7] transition-colors">
                  <span className="w-28 text-xs font-bold text-[#059669] font-mono">{row.option}</span>
                  <span className="w-44 text-xs text-[#888888] font-mono">{row.type}</span>
                  <span className="w-24 text-xs text-[#9CA3AF] font-mono">{row.default}</span>
                  <span className="flex-1 text-xs text-[#888888]">{row.description}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs text-[#888888] mb-3 font-bold tracking-[0.05em] uppercase">Environment URLs</p>
              <div className="border border-[#D4D4D0] divide-y divide-[#D4D4D0]">
                {ENVIRONMENTS.map((env) => (
                  <div key={env.name} className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs font-bold text-[#111111]">{env.name}</span>
                    <code className="text-xs text-[#059669]">{env.url}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickstartSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          TUTORIAL
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          QUICKSTART
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-6 lg:p-8">
            <p className="text-xs text-[#888888] leading-relaxed mb-6">
              GET UP AND RUNNING IN MINUTES. THE FOLLOWING EXAMPLE DEMONSTRATES THE
              CORE WORKFLOW: INITIALIZE THE CLIENT, FETCH A CREATOR, LIST TOP CREATORS,
              SEND A TIP, AND RETRIEVE ANALYTICS.
            </p>

            <CodeBlock code={QUICKSTART_CODE} lang="typescript" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ModulesSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          REFERENCE
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          API MODULES
        </h2>

        <div className="space-y-6">
          {MODULES.map((mod) => (
            <div key={mod.title} className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center size-8 border border-[#D4D4D0] bg-[#F9F9F7]">
                    <Code className="size-4 text-[#059669]" weight="bold" />
                  </div>
                  <h3 className="text-sm font-bold text-[#111111] tracking-[-0.02em] uppercase">
                    {mod.title}
                  </h3>
                </div>

                <div className="border border-[#D4D4D0] divide-y divide-[#D4D4D0]">
                  {mod.methods.map((method) => (
                    <div key={method.signature} className="px-4 py-4 hover:bg-[#F9F9F7] transition-colors">
                      <div className="flex items-start gap-4">
                        <span className="inline-flex items-center px-2 py-0.5 border border-[#059669] bg-[#F0FDF4] text-[10px] font-bold text-[#059669] tracking-[0.05em] shrink-0 mt-0.5">
                          {method.returns.includes("Promise") ? "ASYNC" : "SYNC"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <code className="block text-xs font-bold text-[#111111] font-mono mb-1 break-all">
                            {method.signature}
                          </code>
                          <p className="text-xs text-[#888888] leading-relaxed">{method.description}</p>
                          <p className="mt-1 text-[10px] text-[#9CA3AF] tracking-[0.05em]">
                            <span className="font-bold">RETURNS</span>: <code className="text-[#059669]">{method.returns}</code>
                          </p>
                        </div>
                      </div>
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

function TypesSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          TYPES
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          TYPE DEFINITIONS
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-6 lg:p-8">
            <p className="text-xs text-[#888888] leading-relaxed mb-6">
              THE SDK IS FULLY TYPED. KEY INTERFACES ARE EXPORTED FOR TYPE-SAFE
              INTEGRATION WITH YOUR APPLICATION.
            </p>

            <CodeBlock code={`interface TipChainConfig {
  apiKey?: string;
  environment?: "production" | "staging" | "development";
  baseUrl?: string;
}

interface Creator {
  walletAddress: string;
  username: string;
  displayName?: string | null;
  bio: string;
  avatarUrl: string | null;
  socialLinks: Record<string, string>;
  totalTips: string;
  supporterCount: number;
  verified: boolean;
  createdAt: string;
}

interface TipInput {
  to: string;
  amount: number;
  token?: "SOL" | "USDC";
  message?: string;
}

interface TipResult {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  amount: string;
  token: string;
  txHash?: string;
  timestamp: string;
}

interface AnalyticsOverview {
  totalEarnings: string;
  totalTransactions: number;
  totalSupporters: number;
  monthlyEarnings: string;
}`} lang="typescript" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SelfHostedSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          INFRASTRUCTURE
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          SELF-HOSTED DEPLOYMENT
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-6 lg:p-8">
            <p className="text-xs text-[#888888] leading-relaxed mb-6">
              FOR SELF-HOSTED INSTANCES, CONFIGURE THE SDK TO POINT TO YOUR OWN
              BACKEND BY PROVIDING A CUSTOM BASE URL. THIS IS USEFUL FOR PRIVATE
              DEPLOYMENTS, ENTERPRISE INSTALLATIONS, OR DEVELOPMENT.
            </p>

            <CodeBlock code={`import { TipChain } from "@tipchain/sdk";

// Point to your self-hosted backend
const client = new TipChain({
  baseUrl: "https://tipchain.yourcompany.com",
});

// All API calls will route to your custom endpoint
const creators = await client.creators.list();
const { transaction } = await client.tips.send({
  to: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
  amount: 1.0,
  token: "SOL",
});`} lang="typescript" />

            <div className="mt-6 border border-[#D4D4D0]">
              <div className="px-4 py-3 bg-[#F4F4F0] border-b border-[#D4D4D0]">
                <span className="text-[10px] font-bold tracking-[0.1em] text-[#888888] uppercase">[ ENVIRONMENT MATRIX ]</span>
              </div>
              <div className="divide-y divide-[#D4D4D0]">
                {[
                  { env: "Production", baseUrl: "https://api.tipchain.dev/v1", note: "Default for environment: 'production'" },
                  { env: "Staging", baseUrl: "https://api.staging.tipchain.dev/v1", note: "Default for environment: 'staging'" },
                  { env: "Development", baseUrl: "http://localhost:4000", note: "Default for environment: 'development'" },
                  { env: "Custom", baseUrl: "Your URL", note: "Override via baseUrl config option" },
                ].map((row) => (
                  <div key={row.env} className="flex items-center px-4 py-3">
                    <span className="w-24 text-xs font-bold text-[#111111]">{row.env}</span>
                    <code className="w-64 text-xs text-[#059669] font-mono">{row.baseUrl}</code>
                    <span className="text-xs text-[#9CA3AF]">{row.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ErrorHandlingSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <HazardDivider />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          RELIABILITY
        </samp>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-[#111111] mb-8 uppercase">
          ERROR HANDLING
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="p-6 lg:p-8">
            <p className="text-xs text-[#888888] leading-relaxed mb-6">
              ALL SDK METHODS THROW A <code className="text-[#059669] font-bold">TipChainError</code> ON FAILURE.
              ERRORS INCLUDE THE HTTP STATUS CODE AND A MACHINE-READABLE ERROR CODE FOR PROGRAMMATIC HANDLING.
            </p>

            <CodeBlock code={`import { TipChain, TipChainError } from "@tipchain/sdk";

const client = new TipChain({ apiKey: "tc_..." });

try {
  const creator = await client.creators.get("unknown-user");
} catch (error) {
  if (error instanceof TipChainError) {
    console.error(\`[\${error.code}] \${error.message}\`);
    // TipChainError.status — HTTP status code
    // TipChainError.code   — Machine-readable error code
    // TipChainError.message — Human-readable description
  }
}`} lang="typescript" />

            <div className="mt-4 border border-[#D4D4D0] p-4 bg-[#F9F9F7]">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center size-5 border border-[#059669] bg-[#F0FDF4] text-[10px] font-bold text-[#059669] shrink-0 mt-0.5">!</span>
                <p className="text-[10px] text-[#888888] leading-relaxed">
                  ALWAYS WRAP API CALLS IN TRY/CATCH BLOCKS. THE SDK DOES NOT SWALLOW
                  ERRORS — IT PROPAGATES THEM WITH RICH CONTEXT FOR DEBUGGING AND USER
                  FEEDBACK.
                </p>
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
            { title: "API REFERENCE", desc: "Complete REST API endpoint documentation with request/response schemas.", href: "/docs/api", label: "API DOCS >>" },
            { title: "SOURCE CODE", desc: "Browse the SDK source on GitHub. MIT licensed and open for contributions.", href: "https://github.com/shivamprajapati17/tipchain12", label: "GITHUB >>" },
            { title: "ARCHITECTURE", desc: "System architecture overview — backend, database, Solana integration.", href: "/dashboard", label: "ARCHITECTURE >>" },
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

export default function SDKPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="pt-16" /> {/* Header spacer */}
      <HeroSection />
      <InstallationSection />
      <ConfigurationSection />
      <QuickstartSection />
      <ModulesSection />
      <TypesSection />
      <SelfHostedSection />
      <ErrorHandlingSection />
      <ResourcesSection />
    </div>
  );
}
