"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Coins,
  TrendingUp,
  Bot,
  Gamepad2,
  BarChart3,
  Users,
  Layers,
  ChevronRight,
} from "lucide-react";

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6 },
};

const staggerItem = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay: i * 0.08, duration: 0.5 },
});

// ═══════════════════════════════════════════════════════════════════════════
//  SPLASH — Minimal brand intro
// ═══════════════════════════════════════════════════════════════════════════

function SplashSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      {/* Ambient orbs */}
      <div className="orb orb-1 -top-40 -left-40" />
      <div className="orb orb-2 -bottom-40 -right-40" />
      <div className="orb orb-3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Grid backdrop */}
      <div className="absolute inset-0 grid-backdrop opacity-40" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs text-emerald-400 mb-8"
          >
            <span className="pulse-dot" />
            AI-Native GameFi & DeFi Infrastructure
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-[-0.04em] leading-[0.9] mb-6"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            <span className="text-white">BUILD ON</span>
            <br />
            <span className="text-gradient-emerald">SOLANA</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="max-w-2xl mx-auto text-sm md:text-base text-white/40 leading-relaxed mb-10"
          >
            AI agents · Quests · XP rewards · NFT utilities · DeFi hub · Analytics · Governance
            <br />
            <span className="text-white/30 text-xs">The all-in-one infrastructure layer for the next generation of Web3 applications.</span>
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 h-11 px-7 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              Launch App
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="/ai"
              className="group inline-flex items-center justify-center gap-2 h-11 px-7 rounded-xl glass-card text-white/70 text-sm font-medium hover:text-white hover:bg-white/10 transition-all"
            >
              <Bot className="size-4" />
              Meet TipChain AI
              <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-16"
          >
            {[
              { label: "Protocol Volume", value: "$1M+" },
              { label: "Ecosystem Partners", value: "100+" },
              { label: "AI Agents", value: "1K+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className="text-xs text-white/30 mt-1 tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ECOSYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const MODULES = [
  {
    icon: Bot,
    title: "AI Agent Marketplace",
    desc: "Deploy, discover, and monetize AI agents. Built-in agent wallets, autonomous trading, and on-chain verification.",
    color: "emerald",
    href: "/ai",
  },
  {
    icon: Gamepad2,
    title: "Quest Engine",
    desc: "Gamified on-chain quests with XP, achievements, and reward pools. Drive engagement through challenges.",
    color: "cyan",
    href: "/quests",
  },
  {
    icon: Coins,
    title: "DeFi Hub",
    desc: "Stake, swap, lend, and yield farm. Integrated Solana DeFi primitives with aggregated liquidity.",
    color: "purple",
    href: "/defi",
  },
  {
    icon: Layers,
    title: "NFT Utilities",
    desc: "Dynamic NFTs, soulbound tokens, gated access, and royalty enforcement for creators.",
    color: "emerald",
    href: "/nfts",
  },
  {
    icon: BarChart3,
    title: "Analytics Suite",
    desc: "Real-time dashboards, portfolio tracking, on-chain analytics, and custom reporting.",
    color: "cyan",
    href: "/dashboard",
  },
  {
    icon: Shield,
    title: "Governance",
    desc: "DAO tooling, proposal systems, voting, and treasury management for decentralized decision-making.",
    color: "purple",
    href: "/governance",
  },
];

function EcosystemSection() {
  return (
    <section className="relative py-28 overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 grid-backdrop opacity-20" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div {...fadeInUp}>
          <div className="section-tag mb-3">Ecosystem</div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white mb-4">
            Everything in one
            <br />
            <span className="text-gradient-emerald">unified platform</span>
          </h2>
          <p className="max-w-lg text-sm text-white/30 mb-16">
            Seven integrated modules that work together seamlessly. Pick what you need, deploy in minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            const glowClass =
              mod.color === "emerald"
                ? "hover:border-emerald-500/30 hover:shadow-emerald-500/10"
                : mod.color === "cyan"
                ? "hover:border-cyan-500/30 hover:shadow-cyan-500/10"
                : "hover:border-purple-500/30 hover:shadow-purple-500/10";
            const iconColor =
              mod.color === "emerald"
                ? "text-emerald-400 bg-emerald-500/10"
                : mod.color === "cyan"
                ? "text-cyan-400 bg-cyan-500/10"
                : "text-purple-400 bg-purple-500/10";

            return (
              <motion.a
                key={mod.title}
                href={mod.href}
                {...staggerItem(i)}
                className={`group glass-card rounded-2xl p-6 hover:!bg-white/[0.08] transition-all duration-300 ${glowClass}`}
              >
                <div className={`flex items-center justify-center size-10 rounded-xl mb-4 ${iconColor} group-hover:scale-110 transition-transform`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{mod.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{mod.desc}</p>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  AI SECTION
// ═══════════════════════════════════════════════════════════════════════════

function AISection() {
  return (
    <section className="relative py-28 overflow-hidden gradient-ai border-t border-white/5">
      <div className="orb orb-1 top-0 right-0" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeInUp}>
            <div className="section-tag mb-3">AI Infrastructure</div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white mb-6">
              Deploy & manage
              <br />
              <span className="text-gradient-emerald">AI agents</span>
              <br />
              on Solana
            </h2>
            <p className="text-sm text-white/40 leading-relaxed mb-8 max-w-md">
              Autonomous agents with wallets, on-chain memory, MCP tools, and LangGraph orchestration.
              Build trading bots, content agents, or community managers in minutes.
            </p>
            <div className="space-y-4 mb-10">
              {[
                "Agent wallet with private key management",
                "On-chain memory & state persistence",
                "MCP tool integration & LangGraph workflows",
                "Autonomous trading & DeFi operations",
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-5 rounded-full bg-emerald-500/10 mt-0.5 shrink-0">
                    <Zap className="size-3 text-emerald-400" />
                  </div>
                  <span className="text-sm text-white/60">{feature}</span>
                </div>
              ))}
            </div>
            <a
              href="/ai"
              className="group inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all"
            >
              Explore AI Agents
              <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="glass-card rounded-2xl p-6 glow-cyan">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center justify-center size-8 rounded-lg bg-cyan-500/10">
                  <Bot className="size-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">TipChain AI</div>
                  <div className="text-xs text-white/30">v2.0 — Online</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="pulse-dot" />
                  <span className="text-[10px] text-emerald-400">Active</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { role: "agent", msg: "Analyzing portfolio risk exposure..." },
                  { role: "agent", msg: "Found 3 arbitrage opportunities on Orca." },
                  { role: "user", msg: "Execute if profit > 2%" },
                  { role: "agent", msg: "✅ Executed. Profit: 2.4% in 12s." },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 ${item.role === "user" ? "justify-end" : ""}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs ${
                        item.role === "agent"
                          ? "bg-white/5 text-white/70"
                          : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {item.msg}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                <span className="text-[10px] text-white/20">Type a message...</span>
                <span className="ml-auto text-[10px] text-white/20">$TC token required</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  GAMEFI SECTION
// ═══════════════════════════════════════════════════════════════════════════

function GameFiSection() {
  return (
    <section className="relative py-28 overflow-hidden gradient-gamefi border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="glass-card rounded-2xl p-6 glow-purple">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Active Quests", value: "24" },
                  { label: "XP Earned", value: "128,450" },
                  { label: "Rewards Pool", value: "5,000 $TC" },
                  { label: "Players", value: "3,247" },
                ].map((stat) => (
                  <div key={stat.label} className="glass rounded-xl p-4 text-center">
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { quest: "Daily Compass", xp: 250, progress: 80 },
                  { quest: "Liquidity Provider", xp: 500, progress: 45 },
                  { quest: "Agent Deployer", xp: 1000, progress: 20 },
                ].map((q) => (
                  <div key={q.quest} className="glass rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/70 font-medium">{q.quest}</span>
                      <span className="text-[10px] text-emerald-400">+{q.xp} XP</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        style={{ width: `${q.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeInUp} className="order-1 lg:order-2">
            <div className="section-tag mb-3">GameFi</div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white mb-6">
              Play, earn, and
              <br />
              <span className="text-gradient-emerald">level up</span>
              <br />
              on Solana
            </h2>
            <p className="text-sm text-white/40 leading-relaxed mb-8 max-w-md">
              Gamified quest system with XP, skill trees, achievement badges, and reward pools.
              Complete challenges, earn rewards, and climb the leaderboard.
            </p>
            <a
              href="/quests"
              className="group inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-all"
            >
              View Quests
              <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DEFI SECTION
// ═══════════════════════════════════════════════════════════════════════════

function DeFiSection() {
  return (
    <section className="relative py-28 overflow-hidden gradient-defi border-t border-white/5">
      <div className="orb orb-2 -bottom-40 -left-40" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeInUp}>
            <div className="section-tag mb-3">DeFi Hub</div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white mb-6">
              Full-spectrum
              <br />
              <span className="text-gradient-emerald">DeFi operations</span>
              <br />
              integrated
            </h2>
            <p className="text-sm text-white/40 leading-relaxed mb-8 max-w-md">
              Stake, swap, lend, and yield farm across Solana. Aggregated liquidity, MEV protection,
              and cross-protocol portfolio management.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Staking", "Swaps", "Lending", "Yield", "LP Positions"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/50 border border-white/5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="glass-card rounded-2xl p-6 glow-green">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-white">Portfolio Overview</h3>
                <span className="text-[10px] text-emerald-400">+12.4% this week</span>
              </div>
              <div className="space-y-3">
                {[
                  { asset: "SOL", balance: "145.8", value: "$24,367", change: "+5.2%" },
                  { asset: "USDC", balance: "12,450.0", value: "$12,450", change: "0.0%" },
                  { asset: "$TC", balance: "8,320.0", value: "$4,992", change: "+18.7%" },
                  { asset: "EPT", balance: "1,240.0", value: "$3,720", change: "-2.1%" },
                ].map((row) => (
                  <div key={row.asset} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-white/5 text-xs font-bold text-white/70">
                        {row.asset.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{row.asset}</div>
                        <div className="text-xs text-white/30">{row.balance}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">{row.value}</div>
                      <div className={`text-xs ${row.change.startsWith("+") ? "text-emerald-400" : row.change === "0.0%" ? "text-white/30" : "text-red-400"}`}>
                        {row.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MARKETPLACE
// ═══════════════════════════════════════════════════════════════════════════

function MarketplaceSection() {
  const items = [
    { title: "AI Trading Bot", price: "500 $TC", sales: 234, tag: "Agent" },
    { title: "Quest Template Pack", price: "100 $TC", sales: 892, tag: "Template" },
    { title: "Soulbound Badge", price: "50 $TC", sales: 1247, tag: "NFT" },
    { title: "Analytics Dashboard", price: "Free", sales: 3412, tag: "Tool" },
  ];

  return (
    <section className="relative py-28 overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 grid-backdrop opacity-20" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div {...fadeInUp}>
          <div className="section-tag mb-3">Marketplace</div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white mb-4">
            Discover & trade
            <br />
            <span className="text-gradient-emerald">ecosystem assets</span>
          </h2>
          <p className="max-w-lg text-sm text-white/30 mb-16">
            Agent templates, NFTs, tools, and modules. Build, sell, and buy in the TipChain marketplace.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <motion.a
              key={item.title}
              href="/marketplace"
              {...staggerItem(i)}
              className="group glass-card rounded-2xl p-5 hover:!bg-white/[0.08] transition-all"
            >
              <div className="flex items-center justify-center h-28 rounded-xl bg-white/[0.02] mb-4 border border-white/5 group-hover:border-white/10 transition-colors">
                <div className="text-3xl">
                  {item.tag === "Agent" ? "🤖" : item.tag === "Template" ? "📦" : item.tag === "NFT" ? "🏅" : "📊"}
                </div>
              </div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                  {item.tag}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-400">{item.price}</span>
                <span className="text-[10px] text-white/30">{item.sales} sales</span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ROADMAP
// ═══════════════════════════════════════════════════════════════════════════

function RoadmapSection() {
  const phases = [
    {
      phase: "Phase 1",
      title: "Infrastructure",
      status: "Live",
      items: ["Wallet & Identity", "Creator Profiles", "Tip Engine"],
      color: "emerald",
    },
    {
      phase: "Phase 2",
      title: "AI",
      status: "In Progress",
      items: ["AI Agent Marketplace", "LangGraph Integration", "MCP Tools"],
      color: "cyan",
    },
    {
      phase: "Phase 3",
      title: "GameFi",
      status: "Coming Soon",
      items: ["Quest Engine", "XP & Badges", "Reward Pools"],
      color: "purple",
    },
    {
      phase: "Phase 4",
      title: "DeFi",
      status: "Planned",
      items: ["Staking Pool", "DEX Aggregator", "Yield Strategies"],
      color: "emerald",
    },
    {
      phase: "Phase 5",
      title: "Platform SDK",
      status: "Planned",
      items: ["TypeScript SDK", "React Hooks", "CLI Tools"],
      color: "cyan",
    },
  ];

  return (
    <section className="relative py-28 overflow-hidden border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div {...fadeInUp}>
          <div className="section-tag mb-3">Roadmap</div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white mb-4">
            Building the future
            <br />
            <span className="text-gradient-emerald">phase by phase</span>
          </h2>
          <p className="max-w-lg text-sm text-white/30 mb-16">
            Our development roadmap spans infrastructure through full platform SDK.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-4">
          {phases.map((phase, i) => {
            const borderColor =
              phase.color === "emerald"
                ? "border-emerald-500/30"
                : phase.color === "cyan"
                ? "border-cyan-500/30"
                : "border-purple-500/30";
            const statusColor =
              phase.status === "Live"
                ? "text-emerald-400"
                : phase.status === "In Progress"
                ? "text-cyan-400"
                : "text-white/30";

            return (
              <motion.div
                key={phase.phase}
                {...staggerItem(i)}
                className={`glass-card rounded-2xl p-5 ${borderColor} border`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                    {phase.phase}
                  </span>
                  <span className={`text-[10px] font-medium ${statusColor}`}>{phase.status}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-3">{phase.title}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-white/40">
                      <div className="size-1 rounded-full bg-white/20" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  CTA — Final
// ═══════════════════════════════════════════════════════════════════════════

function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden border-t border-white/5 gradient-hero">
      <div className="orb orb-1 -top-60 -right-60" />
      <div className="orb orb-2 -bottom-60 -left-60" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.div {...fadeInUp}>
          <div className="section-tag mb-4 justify-center before:!bg-emerald-500">
            Get Started
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white mb-6">
            Ready to build on
            <br />
            <span className="text-gradient-emerald">TipChain?</span>
          </h2>
          <p className="text-sm text-white/30 max-w-lg mx-auto mb-10">
            Connect your wallet, create your profile, and start exploring the TipChain ecosystem.
            AI agents, quests, DeFi — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25"
            >
              Launch Dashboard
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="/creators"
              className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl glass-card text-white/60 text-sm font-medium hover:text-white hover:bg-white/10 transition-all"
            >
              <Users className="size-4" />
              Explore Creators
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  FOOTER
// ═══════════════════════════════════════════════════════════════════════════

const WHITEPAPER_URL =
  "https://docs.google.com/document/d/1Q1NoKZlZSb_xE7pHY9kbPaliufmySOONzFl1cVZ95iI/edit?usp=sharing";

function Footer() {
  return (
    <footer className="relative gradient-footer border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex items-center justify-center size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                T
              </span>
              <span className="text-sm font-semibold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                TipChain
              </span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed max-w-xs">
              AI-native GameFi & DeFi infrastructure platform on Solana. Build, earn, and govern.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Platform</h4>
            <div className="space-y-2.5">
              {["AI Agents", "Quests", "DeFi Hub", "Marketplace", "Governance"].map((link) => (
                <a
                  key={link}
                  href={`/${link.toLowerCase().replace(/\s+/g, "")}`}
                  className="block text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Developers</h4>
            <div className="space-y-2.5">
              <a href="/docs/sdk" className="block text-xs text-white/30 hover:text-white/60 transition-colors">SDK</a>
              <a href="/docs/api-reference" className="block text-xs text-white/30 hover:text-white/60 transition-colors">API Reference</a>
              <a href={WHITEPAPER_URL} target="_blank" rel="noopener noreferrer" className="block text-xs text-white/30 hover:text-white/60 transition-colors">Whitepaper</a>
              <a href="https://github.com/shivamprajapati17/tipchain12" target="_blank" rel="noopener noreferrer" className="block text-xs text-white/30 hover:text-white/60 transition-colors">GitHub</a>
            </div>
          </div>

          {/* Network */}
          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Network</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-white/30">
                <span className="pulse-dot" />
                Solana Devnet
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30">
                <span className="inline-block size-1.5 rounded-full bg-cyan-400/50" />
                Helius RPC
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30">
                <span className="inline-block size-1.5 rounded-full bg-emerald-400/50" />
                Status: Operational
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] text-white/20">
            © 2026 TipChain. Built on Solana.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/20">v2.0</span>
            <span className="text-[10px] text-white/20">$TC</span>
            <span className="text-[10px] text-white/20">Powered by Solana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SplashSection />
      <EcosystemSection />
      <AISection />
      <GameFiSection />
      <DeFiSection />
      <MarketplaceSection />
      <RoadmapSection />
      <CTASection />
      <Footer />
    </div>
  );
}
