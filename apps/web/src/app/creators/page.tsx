"use client";

import { Button } from "@/components/ui/button";
import { Search, Users, TrendingUp, X, AlertCircle, RefreshCw, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCreators, lamportsToSol, type CreatorResponse } from "@/lib/api";

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
    <Link href={`/creator/${creator.username}`} className="group block h-full">
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative h-full rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition-all duration-300 group-hover:border-emerald-500/20 group-hover:bg-white/[0.05]"
      >
        <div className="flex h-full flex-col">
          {/* Avatar & Name */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 font-bold text-sm text-emerald-400">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-white truncate">
                  {displayName(creator.username)}
                </h3>
                <PulseDot />
              </div>
              <p className="truncate text-xs text-white/40">
                @{creator.username}
              </p>
            </div>
            <ArrowUpRight className="size-4 text-white/20 shrink-0 group-hover:text-emerald-400 transition-colors" />
          </div>

          {/* Bio */}
          <p className="mb-4 text-xs text-white/40 leading-relaxed line-clamp-2 flex-1">
            {creator.bio || "No bio yet."}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3 text-white/30" />
              <span className="text-xs font-semibold text-white/70">
                {earnings.toFixed(2)} SOL
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="size-3 text-white/30" />
              <span className="text-xs text-white/50">
                {creator.supporterCount} supporters
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
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
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
        {query.trim() ? <Search className="size-7 text-white/30" /> : <Users className="size-7 text-white/30" />}
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white">
        {query.trim() ? "No creators found" : "No creators yet"}
      </h2>
      <p className="text-sm text-white/40 max-w-md">
        {query.trim()
          ? <>No results match &ldquo;{query}&rdquo;. Try adjusting your search.</>
          : <>Be the first creator on TipChain. Connect your wallet and create your profile.</>}
      </p>
      {!query.trim() && (
        <Link href="/profile" className="mt-6">
          <Button className="gap-2 rounded-xl">
            <Users className="size-4" />
            Create Your Profile
          </Button>
        </Link>
      )}
    </motion.div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function CreatorsSkeleton() {
  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 h-8 w-48 shimmer-slow rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-2xl border border-white/5 bg-white/[0.03] p-5 overflow-hidden relative"
            >
              <div className="absolute inset-0 shimmer-slow opacity-50" />
              <div className="relative">
                <div className="mb-3 flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded-md bg-white/5" />
                    <div className="h-3 w-16 rounded-md bg-white/5" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-full rounded-md bg-white/5" />
                  <div className="h-3 w-3/4 rounded-md bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Error State ────────────────────────────────────────────────────────────

function CreatorsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
          <AlertCircle className="size-7 text-red-400" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-white">Failed to load creators</h1>
        <p className="mb-6 text-sm text-white/40">{message}</p>
        <Button onClick={onRetry} variant="outline" className="gap-2 rounded-xl">
          <RefreshCw className="size-4" />
          Try Again
        </Button>
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
  const [sortKey, setSortKey] = useState<"earnings" | "supporters" | "newest">("earnings");

  const fetchCreators = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCreators();
      setCreators(data.creators);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load creators");
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
        (c) => c.username.toLowerCase().includes(q) || c.bio.toLowerCase().includes(q)
      );
    }

    switch (sortKey) {
      case "earnings":
        result.sort((a, b) => lamportsToSol(b.totalTips) - lamportsToSol(a.totalTips));
        break;
      case "supporters":
        result.sort((a, b) => b.supporterCount - a.supporterCount);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [searchQuery, sortKey, creators]);

  if (loading) return <CreatorsSkeleton />;
  if (error) return <CreatorsError message={error} onRetry={fetchCreators} />;

  return (
    <div className="flex-1">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <section className="border-b border-white/5 bg-white/[0.02] px-6 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="mx-auto max-w-6xl"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Explore{" "}
                <span className="serif-accent text-emerald-400">Creators</span>
              </h1>
              <p className="mt-2 text-sm text-white/40 max-w-lg">
                Discover and support creators building on Solana.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span>{creators.length} creators</span>
              <span className="text-white/10">|</span>
              <span>
                {creators.reduce((s, c) => s + lamportsToSol(c.totalTips), 0).toFixed(1)} SOL earned
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-white/[0.04] py-3 pl-10 pr-10 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
              className="rounded-xl border border-white/5 bg-white/[0.04] px-3 text-sm text-white/60 outline-none focus:border-emerald-500/30 cursor-pointer"
            >
              <option value="earnings">Total Earned</option>
              <option value="supporters">Most Supporters</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </motion.div>
      </section>

      {/* ── Grid ────────────────────────────────────────────────────── */}
      <section className="px-6 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          {filteredCreators.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filteredCreators.map((creator, i) => (
                  <motion.div
                    key={creator.walletAddress}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                  >
                    <CreatorCard creator={creator} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState query={searchQuery} />
          )}
        </div>
      </section>
    </div>
  );
}
