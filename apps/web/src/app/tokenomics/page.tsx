"use client";

import {
  Coins,
  CreditCard,
  Lock,
  Vote,
  Gift,
  Flame,
  RefreshCcw,
  Shield,
  Layers,
  Trophy,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// ─── Motion Variants ────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
} as const;

const fadeSlideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 20 },
  },
} as const;

// ─── Data (from the TipChain tokenomics design doc) ─────────────────────────

const UTILITIES = [
  {
    icon: CreditCard,
    title: "Pay for premium services",
    body: "Use TIP to unlock advanced scans, deeper analysis, higher API limits, continuous monitoring subscriptions, and enterprise-grade features.",
    className: "text-emerald-400 bg-emerald-500/10",
  },
  {
    icon: Lock,
    title: "Stake for discounts",
    body: "Stake TIP to reduce fees on every service, get priority access to new features, higher API limits, and exclusive research.",
    className: "text-sky-400 bg-sky-500/10",
  },
  {
    icon: Vote,
    title: "Govern the platform",
    body: "Holders vote on feature priorities, fee structures, ecosystem fund allocation, and protocol upgrades. Staking boosts voting power.",
    className: "text-violet-400 bg-violet-500/10",
  },
  {
    icon: Gift,
    title: "Rewards for contributions",
    body: "Bug bounties, community contributions, documentation, feedback, and referrals are all rewarded in TIP tokens.",
    className: "text-amber-400 bg-amber-500/10",
  },
];

const STAKING_TIERS = [
  {
    name: "Starter",
    stake: "10 TIP",
    discount: "5% off services",
    perks: ["Service discounts", "Early access to betas"],
    style: "border-white/10 from-white/5 to-transparent",
    accent: "text-white/60",
  },
  {
    name: "Supporter",
    stake: "1,000 TIP",
    discount: "15% off services",
    perks: ["Everything in Starter", "Enhanced API limits", "Community voting weight"],
    style: "border-emerald-500/25 from-emerald-500/10 to-transparent",
    accent: "text-emerald-400",
  },
  {
    name: "Patron",
    stake: "10,000 TIP",
    discount: "30% off services",
    perks: ["Everything in Supporter", "Priority access + beta programs", "Exclusive research & threat intel"],
    style: "border-amber-500/25 from-amber-500/10 to-transparent",
    accent: "text-amber-400",
  },
  {
    name: "Genesis",
    stake: "100,000 TIP",
    discount: "50% off services",
    perks: ["Everything in Patron", "Maximum governance weight", "Direct line to the core team"],
    style: "border-violet-500/25 from-violet-500/10 to-transparent",
    accent: "text-violet-400",
  },
];

const DISTRIBUTION = [
  { label: "Ecosystem Fund", pct: 35, schedule: "Unlocked over 5 years — grants, partnerships, integrations" },
  { label: "Community Rewards", pct: 25, schedule: "Ongoing — bug bounties, contributions, referrals" },
  { label: "Team & Advisors", pct: 20, schedule: "1-year cliff, then 3-year linear vesting" },
  { label: "Private Sale", pct: 10, schedule: "6-month cliff, then 1-year linear vesting" },
  { label: "Public Sale", pct: 5, schedule: "25% unlocked at TGE, 75% linear over 3 months" },
  { label: "Liquidity", pct: 5, schedule: "Unlocked at TGE for exchange listings" },
];

const DEFLATIONARY = [
  {
    icon: Flame,
    title: "Fee burning",
    body: "A percentage of every TIP collected from service fees is permanently removed from circulation — shrinking supply over time.",
    className: "text-rose-400 bg-rose-500/10",
  },
  {
    icon: RefreshCcw,
    title: "Buyback & burn",
    body: "A portion of platform revenue from fiat payments is used to buy back TIP from the open market and burn it — rewarding long-term holders.",
    className: "text-cyan-400 bg-cyan-500/10",
  },
];

const GOVERNANCE_ITEMS = [
  "Feature prioritization — decide which new features and integrations ship next",
  "Fee structure adjustments — propose and vote on service fee changes",
  "Ecosystem fund allocation — direct grants, partnerships, and marketing",
  "Protocol upgrades — approve significant changes to the platform",
];

const GAMIFIED = [
  {
    icon: Trophy,
    title: "Community leaderboards",
    body: "Users who submit high-quality analyses or spot critical issues are ranked and rewarded with TIP.",
    className: "text-emerald-400 bg-emerald-500/10",
  },
  {
    icon: Award,
    title: "Achievement badges & NFTs",
    body: "Digital collectibles awarded for milestones — on-chain proof of your contribution with future utility.",
    className: "text-violet-400 bg-violet-500/10",
  },
];

const RISKS = [
  {
    icon: TrendingUp,
    title: "Market volatility",
    body: "TIP value can fluctuate. Mitigation: strong fundamentals, clear utility, and consistent platform development.",
    className: "text-amber-400 bg-amber-500/10",
  },
  {
    icon: Users,
    title: "Adoption challenges",
    body: "Users may prefer fiat over tokens. Mitigation: significant incentives — discounts and exclusive features — for token usage.",
    className: "text-sky-400 bg-sky-500/10",
  },
  {
    icon: Shield,
    title: "Regulatory uncertainty",
    body: "The crypto landscape evolves. Mitigation: stay informed and adapt the tokenomics as needed to comply.",
    className: "text-rose-400 bg-rose-500/10",
  },
];

const ROADMAP = [
  { phase: "Core Platform", status: "Live", note: "Wallets, profiles, tips, vaults" },
  { phase: "AI Agents", status: "Live", note: "8 AI assistants on /ai" },
  { phase: "GameFi", status: "Live", note: "Quests, XP, seasons, guilds" },
  { phase: "DeFi", status: "In progress", note: "Swaps, staking, pools, treasury" },
  { phase: "SDK & Ecosystem", status: "Next", note: "SDK, CLI, plugin system" },
];

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="mx-auto max-w-6xl px-6 py-20 md:py-24"
    >
      <motion.div variants={fadeSlideUp} className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
          {kicker}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h2>
      </motion.div>
      {children}
    </motion.section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TokenomicsPage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="orb orb-1 -top-40 right-1/4 opacity-40" />
        <div className="orb orb-2 top-1/2 -left-40 opacity-30" />
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-10 pt-16 md:pt-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeSlideUp} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
            <Coins className="size-3.5 text-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
              Tokenomics design
            </span>
          </motion.div>
          <motion.h1
            variants={fadeSlideUp}
            className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-white md:text-6xl"
          >
            The <span className="serif-accent text-emerald-400">TipChain</span>{" "}
            token, designed to last
          </motion.h1>
          <motion.p
            variants={fadeSlideUp}
            className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/50 md:text-base"
          >
            A sustainable economic model for the human-first creator economy on
            Solana. TIP powers services, rewards loyalty, funds growth, and
            lets the community steer where it goes next.
          </motion.p>
          <motion.div variants={fadeSlideUp} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/creators"
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-[0_0_32px_rgba(16,185,129,0.35)]"
            >
              Start earning TIP
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a
              href="#distribution"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Layers className="size-4" />
              View distribution
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ── UTILITY ──────────────────────────────────────────────────────── */}
      <Section kicker="Why it matters" title={<>Four ways <span className="serif-accent text-emerald-400">TIP</span> drives value</>}>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UTILITIES.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={fadeSlideUp}
                transition={{ delay: i * 0.04 }}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.05]"
              >
                <span className={`flex size-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${item.className}`}>
                  <Icon className="size-4" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/45">{item.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── STAKING TIERS ────────────────────────────────────────────────── */}
      <Section kicker="Stake & save" title={<>Loyalty tiers that <span className="serif-accent text-emerald-400">reward commitment</span></>}>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STAKING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              variants={fadeSlideUp}
              transition={{ delay: i * 0.05 }}
              className={`flex flex-col rounded-2xl border bg-gradient-to-b p-6 ${tier.style}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${tier.accent}`}>{tier.name}</span>
                <Lock className={`size-3.5 ${tier.accent} opacity-60`} />
              </div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-white/30">
                Stake {tier.stake}
              </div>
              <div className={`mt-1 text-2xl font-bold tracking-tight ${tier.accent}`}>
                {tier.discount}
              </div>
              <ul className="mt-4 space-y-2 border-t border-white/5 pt-4">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-[11px] leading-relaxed text-white/55">
                    <Sparkles className="mt-0.5 size-3 shrink-0 text-emerald-400/60" />
                    {perk}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── DEFLATIONARY ─────────────────────────────────────────────────── */}
      <Section kicker="Supply mechanics" title={<>Built to <span className="serif-accent text-emerald-400">appreciate</span>, not inflate</>}>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {DEFLATIONARY.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={fadeSlideUp}
                transition={{ delay: i * 0.05 }}
                className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10"
              >
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${item.className}`}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/45">{item.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        <motion.p variants={fadeSlideUp} className="mt-6 max-w-2xl text-xs leading-relaxed text-white/35">
          Together these create a virtuous cycle: demand for services drives
          token utility, deflationary mechanics drive value, value attracts
          contributors, and contributions improve the platform — increasing
          demand again.
        </motion.p>
      </Section>

      {/* ── DISTRIBUTION & VESTING ───────────────────────────────────────── */}
      <Section kicker="Token distribution" title={<>Where every <span className="serif-accent text-emerald-400">TIP</span> goes</>}>
        <div id="distribution" className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Visual bars */}
          <motion.div variants={fadeSlideUp} className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold text-white">Allocation</h3>
            <div className="mt-5 space-y-4">
              {DISTRIBUTION.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/60">{row.label}</span>
                    <span className="font-mono font-semibold text-white">{row.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${row.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        row.pct >= 30
                          ? "bg-emerald-400/80"
                          : row.pct >= 20
                            ? "bg-amber-400/80"
                            : "bg-violet-400/80"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 border-t border-white/5 pt-4 text-[11px] leading-relaxed text-white/35">
              Total supply is set by market analysis and economic modelling.
              Percentages follow the recommended starting model.
            </p>
          </motion.div>

          {/* Vesting table */}
          <motion.div variants={fadeSlideUp} className="lg:col-span-3 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="border-b border-white/5 px-6 py-4">
              <h3 className="text-sm font-semibold text-white">Vesting schedule</h3>
            </div>
            <div className="divide-y divide-white/5">
              {DISTRIBUTION.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 px-6 py-3.5">
                  <div>
                    <div className="text-xs font-medium text-white">{row.label}</div>
                    <div className="mt-0.5 text-[11px] leading-relaxed text-white/40">{row.schedule}</div>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-emerald-400">
                    {row.pct}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── GOVERNANCE ───────────────────────────────────────────────────── */}
      <Section kicker="Community-owned" title={<>Holders <span className="serif-accent text-emerald-400">steer the ship</span></>}>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GOVERNANCE_ITEMS.map((item, i) => (
            <motion.div
              key={item}
              variants={fadeSlideUp}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/[0.03]"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <Vote className="size-3.5" />
              </span>
              <span className="text-xs leading-relaxed text-white/60">{item}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── GAMIFIED REWARDS ─────────────────────────────────────────────── */}
      <Section kicker="Play to earn" title={<>Gamified <span className="serif-accent text-emerald-400">rewards</span> keep everyone engaged</>}>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {GAMIFIED.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={fadeSlideUp}
                transition={{ delay: i * 0.05 }}
                className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10"
              >
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${item.className}`}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/45">{item.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── ROADMAP ──────────────────────────────────────────────────────── */}
      <Section kicker="The path forward" title={<>From <span className="serif-accent text-emerald-400">core</span> to ecosystem</>}>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ROADMAP.map((step, i) => (
            <motion.div
              key={step.phase}
              variants={fadeSlideUp}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/30">Phase {i + 1}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                    step.status === "Live"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : step.status === "In progress"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-white/5 text-white/40"
                  }`}
                >
                  {step.status}
                </span>
              </div>
              <div className="mt-3 text-sm font-semibold text-white">{step.phase}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-white/40">{step.note}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── RISKS ────────────────────────────────────────────────────────── */}
      <Section kicker="Honest engineering" title={<>Risks, <span className="serif-accent text-emerald-400">named</span> and mitigated</>}>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {RISKS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={fadeSlideUp}
                transition={{ delay: i * 0.05 }}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10"
              >
                <span className={`flex size-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${item.className}`}>
                  <Icon className="size-4" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/45">{item.body}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent px-6 py-14 text-center md:px-12"
        >
          <div aria-hidden className="orb orb-1 -bottom-32 left-1/2 -translate-x-1/2 opacity-40" />
          <h2 className="mx-auto max-w-xl text-3xl font-bold leading-tight tracking-[-0.02em] text-white md:text-4xl">
            The best way to start earning TIP is{" "}
            <span className="serif-accent text-emerald-400">simply showing up</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50">
            Tip a creator, complete quests, climb the leaderboard, and bring
            your community along. The token rewards the people who build the
            platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/creators"
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-[0_0_32px_rgba(16,185,129,0.35)]"
            >
              Find a creator
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/quests"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Trophy className="size-4" />
              Start quests
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
