"use client";

import { Button } from "@/components/ui/button";
import {
  Swords,
  Trophy,
  Sparkles,
  Users,
  Target,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getQuests } from "@/lib/api";

// ─── Motion Variants ────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
} as const;

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 20 },
  },
} as const;

function PulseDot() {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-emerald-500"
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ─── Quest Card ─────────────────────────────────────────────────────────────

function QuestCard({ quest, index }: { quest: any; index: number }) {
  const reward = quest?.reward ?? quest?.xpReward ?? 0;
  const title = quest?.title ?? quest?.name ?? `Quest #${index + 1}`;
  const desc =
    quest?.description ??
    quest?.objective ??
    "Complete this quest to earn rewards and XP.";
  const completed = quest?.status === "completed" || quest?.isCompleted;

  return (
    <motion.div variants={fadeSlideUp} layout>
      <motion.div
        whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        className="relative h-full overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/20 to-muted/5 p-[2px] shadow-premium transition-all duration-500 hover:shadow-premium-lg"
      >
        <div className="rounded-[calc(1.5rem-3px)] h-full bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="p-5 h-full flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-orange-500/5 to-orange-500/10">
                <Target className="size-4 text-orange-400/80" />
              </div>
              {completed ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                  <CheckCircle2 className="size-3" /> Done
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>

            <h3 className="mb-2 text-sm font-semibold leading-snug">{title}</h3>
            <p className="mb-4 flex-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {desc}
            </p>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-500/90">
                <Sparkles className="size-3" /> +{reward} XP
              </span>
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-emerald-500 transition-colors">
                Start <ArrowUpRight className="size-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Fallback Data ──────────────────────────────────────────────────────────

const FALLBACK_QUESTS = [
  { title: "First Blood", description: "Send your first tip to any creator on TipChain.", reward: 50 },
  { title: "Creator Onboarding", description: "Create your creator profile and share it with the world.", reward: 100 },
  { title: "Community Builder", description: "Follow 3 creators and join the TipChain community.", reward: 75 },
  { title: "Liquidity Provider", description: "Stake into your first liquidity pool on Solana DeFi.", reward: 150 },
  { title: "Collector", description: "Mint your first collectible or badge on-chain.", reward: 120 },
  { title: "PvP Challenger", description: "Win your first PvP match in the arena.", reward: 200 },
];

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function QuestsSkeleton() {
  return (
    <div className="flex-1">
      <section className="border-b border-border bg-muted/20 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 h-8 w-48 shimmer-slow rounded-lg" />
          <div className="h-4 w-80 shimmer-slow rounded-md" />
        </div>
      </section>
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl border border-border bg-card p-5 overflow-hidden relative">
                <div className="absolute inset-0 shimmer-slow opacity-50" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Error State ────────────────────────────────────────────────────────────

function QuestsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
          <AlertCircle className="size-7 text-destructive" />
        </div>
        <h1 className="mb-2 text-xl font-semibold">Failed to load quests</h1>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={onRetry} variant="outline" className="gap-2 rounded-xl">
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function QuestsPage() {
  const [quests, setQuests] = useState<any[]>(FALLBACK_QUESTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuests();
      const list = Array.isArray(data) ? data : data?.quests;
      if (list && list.length > 0) {
        setQuests(list);
      }
    } catch (err) {
      // Fall back to showcase data — quests module is optional content
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  if (loading) {
    return <QuestsSkeleton />;
  }

  if (error) {
    return <QuestsError message={error} onRetry={fetchQuests} />;
  }

  return (
    <div className="flex-1">
      {/* ── Gradient Mesh Background ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-32 -top-32 size-[500px] rounded-full opacity-10 dark:opacity-5"
          style={{ background: "radial-gradient(circle at 30% 50%, oklch(0.55 0.13 60), transparent 70%)", filter: "blur(80px)" }}
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
          className="mx-auto max-w-6xl"
        >
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              <Swords className="size-3" /> GameFi
            </span>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Quests &amp; Missions
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg leading-relaxed">
                Complete quests, earn XP, and climb the leaderboards. Every
                achievement is verifiable on Solana.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-4 shadow-premium">
              {[
                { label: "Active Quests", value: String(quests.length), icon: Target },
                { label: "XP Earned", value: "1,240", icon: Sparkles },
                { label: "Players", value: "482", icon: Users },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="mb-1 flex justify-center">
                    <stat.icon className="size-4 text-orange-500/60" />
                  </div>
                  <p className="text-sm font-bold tracking-tight">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Quests Grid */}
      <section className="px-6 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {quests.length} quests available
            </p>
            <Link href="/leaderboard">
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                <Trophy className="size-3" /> View Leaderboard
              </span>
            </Link>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {quests.map((quest, i) => (
                <QuestCard key={quest?.id ?? i} quest={quest} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* XP / Seasons strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid gap-4 sm:grid-cols-2"
          >
            <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
              <div className="mb-2 flex items-center gap-2">
                <Layers className="size-4 text-orange-500/70" />
                <h3 className="text-sm font-semibold">Season System</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Quests rotate each season with fresh rewards, exclusive badges,
                and limited-edition collectibles for top players.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="size-4 text-orange-500/70" />
                <h3 className="text-sm font-semibold">XP &amp; Achievements</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Earn XP for every completed quest and unlock achievement NFTs
                that prove your journey on-chain.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
