"use client";

import { Button } from "@/components/ui/button";
import {
  Trophy,
  Star,
  Coins,
  Users,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLeaderboard, lamportsToSol, type LeaderboardEntry } from "@/lib/api";

// ─── Motion Variants ────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.15 },
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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 150, damping: 18 },
  },
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function truncateAddress(address: string) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function PulseDot() {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-emerald-500"
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ─── Rank Badge ─────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <motion.div
        whileHover={{ scale: 1.1, rotate: -5 }}
        className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20"
      >
        <Trophy className="size-5" />
      </motion.div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 text-sm font-bold text-white shadow-md">
        2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-sm font-bold text-white shadow-md">
        3
      </div>
    );
  }
  return (
    <div className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-muted-foreground">
      {rank}
    </div>
  );
}

// ─── Leaderboard Row ────────────────────────────────────────────────────────

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const totalSol = lamportsToSol(entry.totalTipped);
  const isTop3 = entry.rank <= 3;

  return (
    <motion.div
      variants={fadeSlideUp}
      layout
      whileHover={{
        x: 6,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      className={`group flex items-center gap-4 rounded-xl px-4 py-4 transition-all duration-500 ${
        isTop3
          ? "bg-gradient-to-r from-emerald-50/80 to-transparent"
          : "hover:bg-muted/20"
      }`}
    >
      <RankBadge rank={entry.rank} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {truncateAddress(entry.walletAddress)}
          </span>
          <a
            href={`https://solscan.io/account/${entry.walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/50 hover:text-emerald-600 transition-colors duration-200"
          >
            <ArrowUpRight className="size-3.5" />
          </a>
          {isTop3 && <PulseDot />}
        </div>
        <p className="text-xs text-muted-foreground">
          {entry.tipCount} {entry.tipCount === 1 ? "tip" : "tips"} sent
        </p>
      </div>

      <motion.div
        className="text-right"
        whileHover={{ scale: 1.05 }}
      >
        <p
          className={`text-base font-bold tracking-tight ${
            isTop3 ? "text-emerald-700" : ""
          }`}
        >
          {totalSol.toFixed(2)} SOL
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="flex-1">
      <section className="border-b border-border bg-muted/20 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 h-8 w-56 shimmer-slow rounded-lg" />
          <div className="h-4 w-80 shimmer-slow rounded-md" />
        </div>
      </section>
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 overflow-hidden relative"
            >
              <div className="absolute inset-0 shimmer-slow opacity-50" />
              <div className="relative flex items-center gap-4 w-full">
                <div className="size-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded-md bg-muted" />
                  <div className="h-3 w-20 rounded-md bg-muted" />
                </div>
                <div className="h-5 w-24 rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Error State ────────────────────────────────────────────────────────────

function LeaderboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
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
        <h1 className="mb-2 text-xl font-semibold">
          Failed to load leaderboard
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={onRetry}
            variant="outline"
            className="gap-2 rounded-xl"
          >
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
        <Trophy className="size-7 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-lg font-semibold">No supporters yet</h2>
      <p className="mb-6 text-sm text-muted-foreground max-w-md">
        The leaderboard will populate as supporters start sending tips to
        creators.
      </p>
      <Link href="/creators">
        <Button variant="outline" className="gap-2 rounded-xl">
          Browse Creators
        </Button>
      </Link>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard(25);
      setEntries(data.leaderboard);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  if (error) {
    return <LeaderboardError message={error} onRetry={fetchLeaderboard} />;
  }

  const totalTipped = entries.reduce(
    (sum, e) => sum + lamportsToSol(e.totalTipped),
    0
  );

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-muted/20 px-6 py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-20 -top-20 size-[300px] rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, oklch(0.45 0.12 160), transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 20, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <div className="mb-2">
            <span className="inline-flex items-center rounded-full border border-border bg-background/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Rankings
            </span>
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Supporter Leaderboard
          </h1>
          <p className="mb-8 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            The top supporters on TipChain, ranked by total amount tipped to
            creators on Solana. Every tip is verifiable on-chain.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            {[
              {
                label: "Supporters",
                value: String(entries.length),
                icon: Users,
              },
              {
                label: "Total Tipped",
                value: `${totalTipped.toFixed(2)} SOL`,
                icon: Coins,
              },
              {
                label: "Total Tips",
                value: String(
                  entries.reduce((sum, e) => sum + e.tipCount, 0)
                ),
                icon: Star,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-3 text-center shadow-premium"
              >
                <div className="mb-1 flex justify-center">
                  <stat.icon className="size-4 text-emerald-600/60" />
                </div>
                <p className="text-sm font-bold tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Leaderboard */}
      <section className="px-6 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          {entries.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-1"
            >
              <AnimatePresence mode="popLayout">
                {entries.map((entry) => (
                  <LeaderboardRow key={entry.walletAddress} entry={entry} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState />
          )}

          {entries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-xs text-muted-foreground">
                Rankings are based on total SOL/USDC tipped across all
                creators. All transactions are recorded on Solana.
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
