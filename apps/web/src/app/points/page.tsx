"use client";

import {
  Zap,
  Sparkles,
  Trophy,
  ArrowUpRight,
  Coins,
  Users,
  Info,
  Calendar,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getPointsLeaderboard } from "@/lib/api";

// ─── Motion Variants ────────────────────────────────────────────────────────

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 20 },
  },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
} as const;

// ─── Tier Data (mirrors backend POINT_TIERS) ────────────────────────────────

const TIERS = [
  {
    name: "Bronze",
    min: 0,
    desc: "Start your journey",
    style:
      "border-amber-700/40 from-amber-800/40 to-amber-900/40 text-amber-300",
    icon: "🥉",
  },
  {
    name: "Silver",
    min: 5_000,
    desc: "A trusted supporter",
    style: "border-zinc-400/40 from-zinc-500/40 to-zinc-600/40 text-zinc-200",
    icon: "🥈",
  },
  {
    name: "Gold",
    min: 25_000,
    desc: "Top-tier patron",
    style: "border-yellow-500/40 from-yellow-600/40 to-amber-700/40 text-yellow-300",
    icon: "🥇",
  },
  {
    name: "Platinum",
    min: 100_000,
    desc: "Elite supporter",
    style: "border-cyan-400/40 from-cyan-500/40 to-sky-600/40 text-cyan-200",
    icon: "💎",
  },
  {
    name: "Hyper",
    min: 500_000,
    desc: "Legendary status",
    style: "border-fuchsia-500/40 from-fuchsia-600/40 to-purple-700/40 text-fuchsia-300",
    icon: "⚡",
  },
];

function formatPoints(n: number) {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}K`
      : String(n);
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function PointsPage() {
  const [topEarners, setTopEarners] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getPointsLeaderboard(10, "all");
      setTopEarners(data.leaderboard.length);
      setTotalPoints(
        data.leaderboard.reduce((sum, e) => sum + e.points, 0)
      );
    } catch {
      // Non-critical — page works without live stats
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex-1">
      {/* Gradient mesh */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-32 -top-32 size-[500px] rounded-full opacity-10 dark:opacity-5"
          style={{
            background:
              "radial-gradient(circle at 30% 50%, oklch(0.55 0.2 300), transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Hero */}
      <section className="relative border-b border-border bg-muted/20 px-6 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              <Zap className="size-3 text-fuchsia-500" /> TipPoints Program
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Earn TipPoints, <span className="text-gradient-emerald">Climb the Tiers</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-sm text-muted-foreground leading-relaxed">
            TipChain&apos;s Hyperliquid-inspired points program. Every tip you
            send <em>and</em> every tip you receive earns points — 1,000 points
            per SOL of activity. Your points unlock tiers, badges, and seasonal
            rewards.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            {[
              {
                label: "Points / SOL",
                value: "1,000",
                icon: Zap,
              },
              {
                label: "Tiers",
                value: "5",
                icon: Layers,
              },
              {
                label: "Leaderboard",
                value: loading ? "—" : String(topEarners ?? "—"),
                icon: Trophy,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-3 text-center shadow-premium"
              >
                <div className="mb-1 flex justify-center">
                  <stat.icon className="size-4 text-fuchsia-500/70" />
                </div>
                <p className="text-sm font-bold tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                icon: Coins,
                title: "1. Send a tip",
                desc: "Every SOL you tip a creator earns points instantly. The bigger the tip, the more points.",
                color: "text-blue-500 bg-blue-500/10",
              },
              {
                icon: Users,
                title: "2. Receive tips",
                desc: "Creators earn points on every tip received — supporting your community pays in points too.",
                color: "text-emerald-500 bg-emerald-500/10",
              },
              {
                icon: Trophy,
                title: "3. Climb tiers",
                desc: "Lifetime points push you from Bronze to Hyper. Higher tiers unlock exclusive badges and rewards.",
                color: "text-fuchsia-500 bg-fuchsia-500/10",
              },
            ].map((step) => (
              <motion.div
                key={step.title}
                variants={fadeSlideUp}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-premium"
              >
                <div
                  className={`mb-3 flex size-10 items-center justify-center rounded-xl ${step.color}`}
                >
                  <step.icon className="size-4.5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tiers */}
      <section className="px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 flex items-center gap-2"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-fuchsia-500/10">
              <Layers className="size-4 text-fuchsia-500" />
            </div>
            <h2 className="text-sm font-semibold">Tier Thresholds</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                variants={fadeSlideUp}
                className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-premium"
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br text-lg ${tier.style}`}
                  >
                    {tier.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{tier.name}</h3>
                      <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {formatPoints(tier.min)}+ pts
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{tier.desc}</p>
                  </div>
                  <div className="hidden sm:block w-24">
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(100, (i + 1) * 20)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Seasons + FAQ strip */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-4xl grid gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-5 shadow-premium"
          >
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="size-4 text-fuchsia-500/70" />
              <h3 className="text-sm font-semibold">Seasonal Resets</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              TipPoints accrue throughout each season. At season end, the
              leaderboard is finalized, top earners claim exclusive rewards, and
              a new season begins. Your <strong>tier</strong> is based on
              lifetime points — it never resets.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-premium"
          >
            <div className="mb-2 flex items-center gap-2">
              <Info className="size-4 text-fuchsia-500/70" />
              <h3 className="text-sm font-semibold">On-chain, always</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Points are computed directly from on-chain transactions — every
              point you see is verifiable on Solana. No hidden multipliers, no
              opaque scoring.
            </p>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/leaderboard">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              <Trophy className="size-3.5" /> View TipPoints Leaderboard
              <ArrowUpRight className="size-3.5" />
            </motion.span>
          </Link>
          <Link href="/quests">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Sparkles className="size-3.5" /> Earn Bonus Points via Quests
            </motion.span>
          </Link>
        </motion.div>

        {/* Live pool */}
        {!loading && totalPoints !== null && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 text-center text-[10px] text-muted-foreground/60"
          >
            Top 10 earners currently hold {totalPoints.toLocaleString()} points
            combined. Start tipping to join them.
          </motion.p>
        )}
      </section>
    </div>
  );
}
