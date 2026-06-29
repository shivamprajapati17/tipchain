"use client";

import { Button } from "@/components/ui/button";
import {
  Search,
  Coins,
  Users,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  X,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCreators, lamportsToSol, type CreatorResponse } from "@/lib/api";

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



// ─── Types ──────────────────────────────────────────────────────────────────

type SortKey = "earnings" | "supporters" | "newest";

// ─── Helpers ────────────────────────────────────────────────────────────────

function displayName(username: string) {
  return username.charAt(0).toUpperCase() + username.slice(1);
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

// ─── Creator Card ───────────────────────────────────────────────────────────

function CreatorCard({ creator }: { creator: CreatorResponse }) {
  const initials = creator.username.slice(0, 2).toUpperCase();
  const earnings = lamportsToSol(creator.totalTips);

  return (
    <motion.div variants={fadeSlideUp} layout>
      <Link href={`/creator/${creator.username}`} className="group block h-full">
        <motion.div
          whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
          className="relative h-full overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/20 to-muted/5 p-[2px] shadow-premium transition-all duration-500 group-hover:shadow-premium-lg"
        >
          <div className="rounded-[calc(1.5rem-3px)] h-full bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="p-5 h-full">
          {/* Hover gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="relative flex h-full flex-col">
            {/* Avatar & Name */}
            <div className="mb-3 flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 font-bold text-sm text-emerald-600/70"
              >
                {initials}
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold truncate">
                    {displayName(creator.username)}
                  </h3>
                  <PulseDot />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  @{creator.username}
                </p>
              </div>
              <motion.div
                className="shrink-0 opacity-0 group-hover:opacity-100"
                initial={{ x: -5 }}
                whileHover={{ x: 2 }}
              >
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </motion.div>
            </div>

            {/* Bio */}
            <p className="mb-4 text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
              {creator.bio || "No bio yet."}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 border-t border-border pt-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3 text-muted-foreground/60" />
                <span className="text-xs font-semibold">
                  {earnings.toFixed(2)} SOL
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="size-3 text-muted-foreground/60" />
                <span className="text-xs text-muted-foreground">
                  {creator.supporterCount}
                </span>
              </div>
            </div>
          </div>
          </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Sort Select ────────────────────────────────────────────────────────────

function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref && !ref.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);

  const options: { key: SortKey; label: string }[] = [
    { key: "earnings", label: "Total Earned" },
    { key: "supporters", label: "Most Supporters" },
    { key: "newest", label: "Newest First" },
  ];

  const currentLabel = options.find((o) => o.key === value)?.label ?? "Sort";

  return (
    <div className="relative" ref={setRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
      >
        <SlidersHorizontal className="size-3.5" />
        {currentLabel}
        <ChevronDown className="size-3 opacity-50" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-popover p-1 shadow-premium z-10"
          >
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  onChange(option.key);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  value === option.key
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
        <Search className="size-7 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-lg font-semibold">No creators found</h2>
      <p className="mb-2 text-sm text-muted-foreground max-w-md">
        No results match &ldquo;{query}&rdquo;. Try adjusting your search.
      </p>
      <Link href="/creators">
        <Button variant="outline" size="sm" className="mt-2 rounded-xl">
          Clear all filters
        </Button>
      </Link>
    </motion.div>
  );
}

// ─── Stats Bar ──────────────────────────────────────────────────────────────

function StatsBar({ creators }: { creators: CreatorResponse[] }) {
  const totalEarnings = creators.reduce(
    (sum, c) => sum + lamportsToSol(c.totalTips),
    0
  );
  const totalSupporters = creators.reduce(
    (sum, c) => sum + c.supporterCount,
    0
  );

  return (
    <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-4 shadow-premium">
      {[
        { label: "Creators", value: String(creators.length), icon: Users },
        {
          label: "Total Earned",
          value: `${totalEarnings.toFixed(1)} SOL`,
          icon: TrendingUp,
        },
        { label: "Supporters", value: String(totalSupporters), icon: Coins },
      ].map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="mb-1 flex justify-center">
            <stat.icon className="size-4 text-emerald-600/60" />
          </div>
          <p className="text-sm font-bold tracking-tight">{stat.value}</p>
          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function CreatorsSkeleton() {
  return (
    <div className="flex-1">
      <section className="border-b border-border bg-muted/20 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 h-8 w-48 shimmer-slow rounded-lg" />
          <div className="h-12 w-full shimmer-slow rounded-xl" />
        </div>
      </section>
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-2xl border border-border bg-card p-5 overflow-hidden relative"
              >
                <div className="absolute inset-0 shimmer-slow opacity-50" />
                <div className="relative">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 rounded-md bg-muted" />
                      <div className="h-3 w-16 rounded-md bg-muted" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 w-full rounded-md bg-muted" />
                    <div className="h-3 w-3/4 rounded-md bg-muted" />
                  </div>
                  <div className="h-4 w-1/2 rounded-md bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Error State ────────────────────────────────────────────────────────────

function CreatorsError({
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
        <h1 className="mb-2 text-xl font-semibold">Failed to load creators</h1>
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

export default function CreatorsPage() {
  const [creators, setCreators] = useState<CreatorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("earnings");

  const fetchCreators = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCreators();
      setCreators(data.creators);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load creators"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    let result = [...creators];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.username.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q)
      );
    }

    switch (sortKey) {
      case "earnings":
        result.sort(
          (a, b) => lamportsToSol(b.totalTips) - lamportsToSol(a.totalTips)
        );
        break;
      case "supporters":
        result.sort((a, b) => b.supporterCount - a.supporterCount);
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [searchQuery, sortKey, creators]);

  if (loading) {
    return <CreatorsSkeleton />;
  }

  if (error) {
    return <CreatorsError message={error} onRetry={fetchCreators} />;
  }

  return (
    <div className="flex-1">
      {/* ── Gradient Mesh Background ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-32 -top-32 size-[500px] rounded-full opacity-10 dark:opacity-5"
          style={{ background: "radial-gradient(circle at 30% 50%, oklch(0.45 0.12 160), transparent 70%)", filter: "blur(80px)" }}
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-20 size-[400px] rounded-full opacity-8 dark:opacity-3"
          style={{ background: "radial-gradient(circle at 70% 50%, oklch(0.55 0.10 160), transparent 70%)", filter: "blur(80px)" }}
          animate={{ scale: [1.1, 1, 1.1], x: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
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
            <span className="inline-flex items-center rounded-full border border-border bg-background/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Directory
            </span>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Explore Creators
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg leading-relaxed">
                Discover and support amazing creators building on Solana. Find
                developers, artists, writers, and more.
              </p>
            </div>
            <StatsBar creators={creators} />
          </div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search creators by name, username, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3.5 pl-11 pr-11 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Content */}
      <section className="px-6 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          {/* Filter Bar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {filteredCreators.length} creator
              {filteredCreators.length !== 1 ? "s" : ""}
            </p>
            <SortSelect value={sortKey} onChange={setSortKey} />
          </div>

          {/* Grid */}
          {filteredCreators.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredCreators.map((creator) => (
                  <CreatorCard key={creator.walletAddress} creator={creator} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState query={searchQuery} />
          )}
        </div>
      </section>
    </div>
  );
}
