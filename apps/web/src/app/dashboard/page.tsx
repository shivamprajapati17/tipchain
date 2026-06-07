"use client";

import { useWallet, useWalletSession, useBalance } from "@solana/react-hooks";
import {
  LayoutDashboard,
  Coins,
  Users,
  Wallet,
  TrendingUp,
  Gift,
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  ArrowUpRight,
  User,
  Bell,
  Sparkles,
  Activity,
  BarChart3,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCreatorByWallet,
  getTransactions,
  lamportsToSol,
  type TransactionResponse,
  type SupporterResponse,
} from "@/lib/api";

// ─── Motion Variants ────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
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
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 20 },
  },
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function truncateAddress(address: string) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

// ─── Perpetual Micro: Pulse Dot ─────────────────────────────────────────────

const PulseDot = memo(function PulseDot() {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-emerald-500"
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
});

// ─── Copy Address ───────────────────────────────────────────────────────────

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 font-mono text-xs text-muted-foreground hover-glass transition-colors"
    >
      {address}
      <motion.span
        key={copied ? "check" : "copy"}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {copied ? (
          <span className="text-emerald-500 text-[10px]">Copied!</span>
        ) : (
          <Copy className="size-3" />
        )}
      </motion.span>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  BENTO CARD ARCHETYPE 1: The Wide Data Stream
//  — Infinite horizontal carousel of metrics with seamless loop
// ═══════════════════════════════════════════════════════════════════════════

const WideDataStream = memo(function WideDataStream({
  solBalance,
  totalTips,
  supporterCount,
  tipCount,
  balanceFetching,
  loading,
}: {
  solBalance: string;
  totalTips: number;
  supporterCount: number;
  tipCount: number;
  balanceFetching: boolean;
  loading: boolean;
}) {
  const metrics = [
    {
      icon: Wallet,
      label: "Wallet Balance",
      value: balanceFetching ? "..." : solBalance,
      sub: "Available SOL",
    },
    {
      icon: TrendingUp,
      label: "Total Earnings",
      value: loading ? "..." : `${totalTips.toFixed(2)} SOL`,
      sub: "Lifetime earned",
    },
    {
      icon: Users,
      label: "Supporters",
      value: loading ? "..." : String(supporterCount),
      sub: "Unique wallets",
    },
    {
      icon: Gift,
      label: "Transactions",
      value: loading ? "..." : String(tipCount),
      sub: "All time",
    },
    {
      icon: BarChart3,
      label: "Avg. Tip",
      value: loading || !tipCount ? "..." : `${(totalTips / Math.max(tipCount, 1)).toFixed(2)} SOL`,
      sub: "Per transaction",
    },
    {
      icon: Star,
      label: "Rank",
      value: "#—",
      sub: "Leaderboard",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-premium">
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/10">
            <Activity className="size-3.5 text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            Live Metrics
          </span>
        </div>
      </div>
      <div className="relative overflow-hidden py-3">
        {/* Gradient fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-card to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-card to-transparent" />

        <motion.div
          className="flex gap-3 px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ width: "fit-content" }}
        >
          {/* Duplicate metrics for seamless loop */}
          {[...metrics, ...metrics].map((metric, i) => (
            <motion.div
              key={`${metric.label}-${i}`}
              className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3"
              whileHover={{
                y: -2,
                borderColor: "oklch(0.45 0.12 160 / 0.3)",
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              style={{ minWidth: "200px" }}
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/5">
                <metric.icon className="size-4.5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight">
                  {metric.value}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {metric.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
//  BENTO CARD ARCHETYPE 2: The Intelligent List
//  — Auto-sorting supporter list using layoutId transitions
// ═══════════════════════════════════════════════════════════════════════════

const IntelligentList = memo(function IntelligentList({
  supporters,
  loading,
}: {
  supporters: SupporterResponse[];
  loading: boolean;
}) {
  const [sorted, setSorted] = useState<SupporterResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initial load
  useEffect(() => {
    if (supporters.length > 0 && sorted.length === 0) {
      setSorted(supporters);
    }
  }, [supporters, sorted.length]);

  // Simulate live re-prioritization loop
  useEffect(() => {
    if (sorted.length < 2) return;

    const interval = setInterval(() => {
      setIsProcessing(true);
      setTimeout(() => {
        setSorted((prev) => {
          const next = [...prev];
          // Swap two random adjacent items to simulate AI re-prioritization
          const i = Math.floor(Math.random() * (next.length - 1));
          [next[i], next[i + 1]] = [next[i + 1], next[i]];
          return next;
        });
        setIsProcessing(false);
      }, 400);
    }, 4000);

    return () => clearInterval(interval);
  }, [sorted.length]);

  const rankColors = [
    "bg-emerald-500/20 text-emerald-700",
    "bg-zinc-300/20 text-zinc-500",
    "bg-amber-700/20 text-amber-700",
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-premium">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <motion.div
            className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10"
            animate={{ rotate: isProcessing ? [0, -10, 10, -5, 0] : 0 }}
            transition={{ duration: 0.4 }}
          >
            <Users className="size-4 text-emerald-600" />
          </motion.div>
          <h2 className="text-sm font-semibold">Supporters</h2>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] text-emerald-600 font-medium"
            >
              Re-prioritizing...
            </motion.span>
          )}
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="size-1.5 rounded-full bg-emerald-500"
          />
        </div>
      </div>
      <div className="p-2">
        {sorted.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {sorted.map((s, i) => (
              <motion.div
                key={s.walletAddress}
                layoutId={s.walletAddress}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                  layout: { type: "spring", stiffness: 150, damping: 20 },
                }}
                className="group flex items-center justify-between rounded-xl px-3 py-3 hover-glass"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    layout
                    className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                      rankColors[i] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </motion.div>
                  <span className="text-sm font-medium">
                    {truncateAddress(s.walletAddress)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {lamportsToSol(s.totalTipped).toFixed(2)} SOL
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.tipCount} {s.tipCount === 1 ? "tip" : "tips"}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="px-3 py-10 text-center">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Users className="mx-auto mb-3 size-6 text-muted-foreground/30" />
            </motion.div>
            <p className="text-sm text-muted-foreground">No supporters yet.</p>
          </div>
        )}
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
//  BENTO CARD ARCHETYPE 3: The Live Status
//  — Activity feed with breathing indicators + pop-up notification badge
// ═══════════════════════════════════════════════════════════════════════════

const LiveStatus = memo(function LiveStatus({
  transactions,
  loading,
}: {
  transactions: TransactionResponse[];
  loading: boolean;
}) {
  const [showBadge, setShowBadge] = useState(false);
  const [badgeTx, setBadgeTx] = useState<TransactionResponse | null>(null);
  const counterRef = useRef(0);

  // Periodic pop-up notification badge
  useEffect(() => {
    if (transactions.length === 0) return;

    const interval = setInterval(() => {
      const tx = transactions[counterRef.current % transactions.length];
      counterRef.current++;
      setBadgeTx(tx);
      setShowBadge(true);
      setTimeout(() => setShowBadge(false), 3000);
    }, 6000);

    return () => clearInterval(interval);
  }, [transactions]);

  const statusItems = [
    {
      label: "Network",
      value: "Solana Mainnet",
      status: "live" as const,
    },
    {
      label: "Last Activity",
      value: transactions.length > 0
        ? formatRelativeTime(transactions[0].timestamp)
        : "No activity",
      status: transactions.length > 0 ? ("active" as const) : ("idle" as const),
    },
    {
      label: "Connection",
      value: "Wallet Connected",
      status: "live" as const,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-premium">
      {/* Clip-content wrapper — keeps rounded corners clipping inner content */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Activity className="size-4 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold">Live Status</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.span
              className="size-1.5 rounded-full bg-emerald-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] text-emerald-600 font-medium">
              LIVE
            </span>
          </div>
        </div>
        <div className="p-3 space-y-2">
          {/* Status items with breathing indicators */}
          {statusItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3"
            >
              <span className="text-xs text-muted-foreground">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{item.value}</span>
                <motion.span
                  className={`size-2 rounded-full ${
                    item.status === "live"
                      ? "bg-emerald-500"
                      : item.status === "active"
                        ? "bg-blue-500"
                        : "bg-zinc-300"
                  }`}
                  animate={
                    item.status === "live"
                      ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }
                      : item.status === "active"
                        ? { opacity: [0.5, 1, 0.5] }
                        : {}
                  }
                  transition={{
                    duration: item.status === "live" ? 2 : 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>
          ))}

          {/* Recent activity mini-list */}
          <div className="pt-2 border-t border-border/50">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Recent Activity
            </p>
            {loading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded-lg shimmer"
                  />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {transactions.slice(0, 3).map((tx) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover-glass"
                  >
                    <motion.div
                      className="size-2 rounded-full bg-emerald-500/40"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="flex-1 truncate text-xs">
                      {lamportsToSol(tx.amount).toFixed(2)} {tx.token}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatRelativeTime(tx.timestamp)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <p className="text-xs text-muted-foreground/60 py-2 text-center">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Pop-up Notification Badge ──────────────────────────────────── */}
      <AnimatePresence>
        {showBadge && badgeTx && (
          <motion.div
            key={`badge-${badgeTx.id}-${counterRef.current}`}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 15,
            }}
            className="relative -mt-1 mb-2 mx-3 flex items-center gap-2 rounded-full border border-emerald-200/40 bg-emerald-50 px-3 py-1.5 shadow-premium-lg"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Bell className="size-3 text-emerald-600" />
            </motion.div>
            <span className="text-[11px] font-medium text-emerald-700 whitespace-nowrap">
              +{lamportsToSol(badgeTx.amount).toFixed(2)} {badgeTx.token}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
//  BENTO CARD ARCHETYPE 5: The Contextual UI (Focus Mode)
//  — Floating action toolbar with staggered float-in micro-icons
// ═══════════════════════════════════════════════════════════════════════════

const ContextualUI = memo(function ContextualUI({
  hasProfile,
  username,
  walletAddress,
  onRefresh,
}: {
  hasProfile: boolean;
  username: string;
  walletAddress: string;
  onRefresh: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      icon: User,
      label: hasProfile ? "Edit Profile" : "Create Profile",
      href: "/profile",
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      icon: hasProfile ? ExternalLink : Gift,
      label: hasProfile ? "Public View" : "Send Tip",
      href: hasProfile ? `/creator/${username}` : "/creators",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      icon: TrendingUp,
      label: "Leaderboard",
      href: "/leaderboard",
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      icon: RefreshCw,
      label: "Refresh",
      href: null,
      action: () => onRefresh(),
      color: "bg-zinc-500/10 text-zinc-600",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Floating action buttons */}
      <AnimatePresence>
        {isExpanded &&
          actions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: i * 0.05,
              }}
            >
              {action.href ? (
                <Link href={action.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-premium-lg hover-glass-strong cursor-pointer"
                  >
                    <div
                      className={`flex size-7 items-center justify-center rounded-lg ${action.color}`}
                    >
                      <action.icon className="size-3.5" />
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">
                      {action.label}
                    </span>
                  </motion.div>
                </Link>
              ) : (
                <motion.button
                  onClick={action.action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-premium-lg hover-glass-strong cursor-pointer"
                >
                  <div
                    className={`flex size-7 items-center justify-center rounded-lg ${action.color}`}
                  >
                    <action.icon className="size-3.5" />
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">
                    {action.label}
                  </span>
                </motion.button>
              )}
            </motion.div>
          ))}
      </AnimatePresence>

      {/* FAB toggle button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-premium-lg hover:bg-emerald-500 transition-colors"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Sparkles className="size-5" />
        </motion.div>
      </motion.button>
    </div>
  );
});

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-7 w-48 rounded-lg shimmer-slow" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[130px] rounded-2xl border border-border bg-card p-5 overflow-hidden relative"
            >
              <div className="absolute inset-0 shimmer-slow" />
              <div className="relative">
                <div className="mb-3 h-4 w-20 rounded-md bg-muted" />
                <div className="h-7 w-28 rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-72 rounded-2xl border border-border bg-card overflow-hidden relative">
          <div className="absolute inset-0 shimmer-slow" />
        </div>
      </div>
    </div>
  );
}

// ─── Error State ────────────────────────────────────────────────────────────

function DashboardError({
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
        <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
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

// ─── Empty State ────────────────────────────────────────────────────────────

function NotConnected() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
          <LayoutDashboard className="size-7 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-xl font-semibold">Dashboard</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Connect your wallet to view your creator dashboard, earnings, and
          supporter activity.
        </p>
        <p className="text-xs text-muted-foreground">
          Use the wallet button in the top-right to connect.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard Page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const { status } = useWallet();
  const session = useWalletSession();
  const walletAddress = session?.account.address ?? "";
  const { lamports, fetching: balanceFetching } = useBalance(walletAddress, {
    fetch: true,
    watch: true,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<{
    username: string;
    bio: string;
    totalTips: number;
    supporterCount: number;
    createdAt: string;
  } | null>(null);
  const [recentTips, setRecentTips] = useState<TransactionResponse[]>([]);
  const [topSupporters, setTopSupporters] = useState<SupporterResponse[]>([]);
  const [profileExists, setProfileExists] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const creatorData = await getCreatorByWallet(walletAddress);
      const profile = creatorData.creator;
      setCreatorProfile({
        username: profile.username,
        bio: profile.bio,
        totalTips: lamportsToSol(profile.totalTips),
        supporterCount: profile.supporterCount,
        createdAt: profile.createdAt,
      });
      setTopSupporters(creatorData.topSupporters.slice(0, 5));
      setRecentTips(creatorData.recentTransactions.slice(0, 5));
      setProfileExists(true);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("404") || err.message.includes("not found"))
      ) {
        setProfileExists(false);
        setCreatorProfile(null);
        setRecentTips([]);
        setTopSupporters([]);

        try {
          const txData = await getTransactions(walletAddress, 5);
          setRecentTips(txData.transactions);
        } catch {
          // Silently fail
        }
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchDashboard();
    }
  }, [walletAddress, fetchDashboard]);

  if (status !== "connected" || !session) {
    return <NotConnected />;
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError message={error} onRetry={fetchDashboard} />;
  }

  const solBalance =
    lamports !== null ? `${(Number(lamports) / 1e9).toFixed(4)} SOL` : "—";

  return (
    <>
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10"
                  whileHover={{ scale: 1.1 }}
                >
                  <LayoutDashboard className="size-5 text-emerald-600" />
                </motion.div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <CopyAddress
                  address={`${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`}
                />
                <span className="text-xs text-muted-foreground">
                  {balanceFetching ? "—" : solBalance}
                </span>
                <PulseDot />
              </div>
            </div>
            {profileExists && creatorProfile && (
              <Link href={`/creator/${creatorProfile.username}`}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button size="sm" className="gap-1.5 rounded-xl self-start sm:self-auto">
                    <ExternalLink className="size-4" />
                    View Public Profile
                  </Button>
                </motion.div>
              </Link>
            )}
          </motion.div>

          {/* ── Archetype 1: The Wide Data Stream ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.2 }}
            className="mb-6"
          >
            <WideDataStream
              solBalance={solBalance}
              totalTips={creatorProfile?.totalTips ?? 0}
              supporterCount={creatorProfile?.supporterCount ?? 0}
              tipCount={recentTips.length}
              balanceFetching={balanceFetching}
              loading={loading}
            />
          </motion.div>

          {/* ── Archetype 2 + 3: Bento Grid (70/30 split) ──────────────────── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-6 lg:grid-cols-5"
          >
            {/* Archetype 2: The Intelligent List (spans 3 cols) */}
            <div className="lg:col-span-3">
              <IntelligentList
                supporters={topSupporters}
                loading={loading}
              />
            </div>

            {/* Archetype 3: The Live Status (spans 2 cols) */}
            <div className="lg:col-span-2">
              <LiveStatus
                transactions={recentTips}
                loading={loading}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Archetype 5: The Contextual UI (floating FAB) ────────────────── */}
      <ContextualUI
        hasProfile={profileExists}
        username={creatorProfile?.username ?? ""}
        walletAddress={walletAddress}
        onRefresh={fetchDashboard}
      />
    </>
  );
}
