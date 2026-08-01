"use client";

import { useWallet, useWalletSession } from "@solana/react-hooks";
import {
  Gift,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Users,
  AlertCircle,
  Sparkles,
  Share2,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getReferralStats, createReferralCode, lamportsToSol } from "@/lib/api";

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
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
} as const;

function truncateAddress(address: string) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ─── Not Connected ──────────────────────────────────────────────────────────

function NotConnected() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
          <Gift className="size-7 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-xl font-semibold">Referral Hub</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Connect your wallet to generate referral codes, track referred
          supporters, and earn commission on every tip they send.
        </p>
        <p className="text-xs text-muted-foreground">
          Use the wallet button in the top-right to connect.
        </p>
      </motion.div>
    </div>
  );
}

// ─── No Profile ─────────────────────────────────────────────────────────────

function NoProfile() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
          <UserPlus className="size-7 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-xl font-semibold">Create a Creator Profile</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Referral codes are tied to creator profiles. Set one up to start
          earning commission from referred supporters.
        </p>
        <Link href="/profile">
          <Button className="gap-2 rounded-xl">
            <UserPlus className="size-4" />
            Create Profile
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ReferralsPage() {
  const { status } = useWallet();
  const session = useWalletSession();
  const walletAddress = session?.account.address ?? "";

  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<any[]>([]);
  const [uses, setUses] = useState<any[]>([]);
  const [totalUses, setTotalUses] = useState(0);
  const [totalCommission, setTotalCommission] = useState("0");
  const [totalReferredTips, setTotalReferredTips] = useState("0");
  const [commissionRate, setCommissionRate] = useState(0.1);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReferralStats(walletAddress);
      setCodes(data.codes || []);
      setUses(data.uses || []);
      setTotalUses(data.totalUses || 0);
      setTotalCommission(data.totalCommission ?? "0");
      setTotalReferredTips(data.totalReferredTips ?? "0");
      if (typeof data.commissionRate === "number") {
        setCommissionRate(data.commissionRate);
      }
      setHasProfile(true);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("404") || err.message.includes("not found"))
      ) {
        setHasProfile(false);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load referrals");
      }
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) loadStats();
    else setLoading(false);
  }, [walletAddress, loadStats]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await createReferralCode(walletAddress);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(
      `https://tipchainsolana.vercel.app/refer/${code}`
    );
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (status !== "connected" || !session) return <NotConnected />;
  if (loading) {
    return (
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-8 w-56 shimmer-slow rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border border-border bg-card overflow-hidden relative"
              >
                <div className="absolute inset-0 shimmer-slow" />
              </div>
            ))}
          </div>
          <div className="h-64 rounded-2xl border border-border bg-card overflow-hidden relative">
            <div className="absolute inset-0 shimmer-slow" />
          </div>
        </div>
      </div>
    );
  }
  if (!hasProfile) return <NoProfile />;

  const shareUrl =
    codes.length > 0
      ? `https://tipchainsolana.vercel.app/refer/${codes[0].code}`
      : null;

  return (
    <div className="flex-1 px-6 py-8">
      {/* Gradient mesh */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-32 -top-32 size-[500px] rounded-full opacity-10 dark:opacity-5"
          style={{
            background:
              "radial-gradient(circle at 30% 50%, oklch(0.6 0.15 45), transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto max-w-4xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10"
              whileHover={{ scale: 1.1 }}
            >
              <Gift className="size-5 text-amber-500" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Referral{" "}
                <span className="serif-accent text-amber-600 dark:text-amber-400">
                  Hub
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Earn {Math.round(commissionRate * 100)}% commission on every tip
                your referred supporters send
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Stats */}
          <motion.div
            variants={fadeSlideUp}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              {
                label: "Commission Earned",
                value: `${lamportsToSol(totalCommission).toFixed(4)} SOL`,
                icon: Sparkles,
                color: "text-emerald-500",
              },
              {
                label: "Referred Tips",
                value: `${lamportsToSol(totalReferredTips).toFixed(2)} SOL`,
                icon: TrendingUp,
                color: "text-blue-500",
              },
              {
                label: "Referred Users",
                value: String(totalUses),
                icon: Users,
                color: "text-amber-500",
              },
              {
                label: "Active Codes",
                value: String(codes.length),
                icon: Share2,
                color: "text-fuchsia-500",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-card p-4 shadow-premium"
              >
                <div className="mb-2 flex items-center gap-2">
                  <stat.icon className={`size-4 ${stat.color}`} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <p className="text-lg font-bold tracking-tight">{stat.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Referral code + share */}
          <motion.div
            variants={fadeSlideUp}
            className="rounded-2xl border border-border bg-card p-5 shadow-premium"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
                  <Share2 className="size-4 text-amber-500" />
                </div>
                <h2 className="text-sm font-semibold">Your Referral Link</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl text-xs"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                {codes.length > 0 ? "New Code" : "Generate Code"}
              </Button>
            </div>

            {shareUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2.5">
                  <code className="flex-1 font-mono text-xs break-all">
                    {shareUrl}
                  </code>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopy(codes[0].code)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover-glass transition-colors"
                  >
                    {copied === codes[0].code ? (
                      <>
                        <Check className="size-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" /> Copy
                      </>
                    )}
                  </motion.button>
                </div>
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
                  <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    Share this link with friends. When they tip any creator on
                    TipChain, you earn {Math.round(commissionRate * 100)}% of
                    their tips as commission.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No referral codes yet — click "Generate Code" to create your
                  first link.
                </p>
              </div>
            )}
          </motion.div>

          {/* Referred users */}
          <motion.div
            variants={fadeSlideUp}
            className="rounded-2xl border border-border bg-card shadow-premium"
          >
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="size-4 text-blue-500" />
              </div>
              <h2 className="text-sm font-semibold">Referred Supporters</h2>
            </div>

            {uses.length > 0 ? (
              <div className="divide-y divide-border/50">
                {uses.map((use, i) => (
                  <div
                    key={`${use.code}-${i}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {use.wallet ? (
                          <>
                            {truncateAddress(use.wallet)}
                            <a
                              href={`https://solscan.io/account/${use.wallet}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1.5 inline-flex text-muted-foreground/50 hover:text-emerald-500 transition-colors"
                            >
                              <ArrowUpRight className="size-3" />
                            </a>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            Anonymous user
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {use.tipCount} {use.tipCount === 1 ? "tip" : "tips"} ·{" "}
                        {new Date(use.usedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {lamportsToSol(use.tipped).toFixed(2)} SOL
                      </p>
                      <p className="text-[10px] text-emerald-500">
                        +{lamportsToSol(use.commission).toFixed(4)} SOL
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Users className="mx-auto mb-3 size-6 text-muted-foreground/30" />
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  No referred supporters yet.
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Share your referral link to start earning commission.
                </p>
              </div>
            )}
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Wallet hint */}
          <motion.div
            variants={fadeSlideUp}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-premium"
          >
            <Wallet className="size-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Commission accrues to your connected wallet:{" "}
              <code className="font-mono">{truncateAddress(walletAddress)}</code>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
