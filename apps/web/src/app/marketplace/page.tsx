"use client";

import {
  ShoppingBag,
  Sparkles,
  Gem,
  Coins,
  ArrowUpRight,
  Layers,
  Flame,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCollectibles, getNFTDrops, getTokenSwaps, getLiquidityPools } from "@/lib/api";

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

// ─── Category Filter ────────────────────────────────────────────────────────

type Category = "all" | "collectibles" | "drops" | "defi";

// ─── Item Card ──────────────────────────────────────────────────────────────

function ItemCard({ item, category, index }: { item: any; category: string; index: number }) {
  const title = item?.name ?? item?.title ?? `${category === "defi" ? "Pool" : "Item"} #${index + 1}`;
  const desc = item?.description ?? item?.objective ?? item?.symbol ?? "";
  const price = item?.price ?? item?.amount ?? item?.apr ?? item?.totalLocked ?? 0;
  const priceLabel = item?.apr !== undefined ? `${price}%` : `${price} SOL`;

  const gradient =
    category === "defi"
      ? "from-blue-500/5 to-blue-500/10"
      : category === "drops"
        ? "from-fuchsia-500/5 to-fuchsia-500/10"
        : "from-violet-500/5 to-violet-500/10";

  const iconColor =
    category === "defi" ? "text-blue-400/80" : category === "drops" ? "text-fuchsia-400/80" : "text-violet-400/80";

  return (
    <motion.div variants={fadeSlideUp} layout>
      <motion.div
        whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        className="relative h-full overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/20 to-muted/5 p-[2px] shadow-premium transition-all duration-500 hover:shadow-premium-lg"
      >
        <div className="rounded-[calc(1.5rem-3px)] h-full bg-card">
          <div className="p-5 h-full flex flex-col">
            {/* Art placeholder */}
            <div className={`mb-4 flex h-28 items-center justify-center rounded-xl border border-border ${gradient}`}>
              <div className="flex flex-col items-center gap-1">
                {category === "defi" ? (
                  <Coins className={`size-7 ${iconColor}`} />
                ) : (
                  <ImageIcon className={`size-7 ${iconColor}`} />
                )}
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">
                  {category}
                </span>
              </div>
            </div>

            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold truncate">{title}</h3>
              <PulseDot />
            </div>
            <p className="mb-4 flex-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {desc || "Rare digital item on the TipChain marketplace."}
            </p>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-bold tracking-tight">{priceLabel}</span>
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-emerald-500 transition-colors">
                View <ArrowUpRight className="size-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Fallback Data ──────────────────────────────────────────────────────────

const FALLBACK_ITEMS: Record<string, any[]> = {
  collectibles: [
    { name: "Genesis Badge", description: "Soulbound badge for early TipChain adopters.", price: 2.5 },
    { name: "Creator Spotlight", description: "Featured creator collectible card.", price: 1.8 },
    { name: "Season 1 Trophy", description: "Limited-edition season 1 reward.", price: 5.0 },
  ],
  drops: [
    { name: "Neon Arcade Pass", description: "Access to exclusive GameFi drops.", price: 3.2 },
    { name: "Pixel Explorers", description: "10-piece generative art drop.", price: 1.5 },
    { name: "DeFi Kings", description: "Rare community NFT drop.", price: 4.0 },
  ],
  defi: [
    { name: "Emerald Pool", description: "Liquidity pool — SOL / USDC.", price: 12.4, apr: 12.4 },
    { name: "Aurora Staking", description: "Stake SOL and earn yield.", price: 8.9, apr: 8.9 },
    { name: "Nova Farm", description: "Yield farming vault.", price: 15.2, apr: 15.2 },
  ],
};

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function MarketplaceSkeleton() {
  return (
    <div className="flex-1">
      <section className="border-b border-border bg-muted/20 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 h-8 w-56 shimmer-slow rounded-lg" />
          <div className="h-4 w-80 shimmer-slow rounded-md" />
        </div>
      </section>
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 rounded-2xl border border-border bg-card p-5 overflow-hidden relative">
                <div className="absolute inset-0 shimmer-slow opacity-50" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [category, setCategory] = useState<Category>("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [collectibles, drops, swaps, pools] = await Promise.allSettled([
        getCollectibles(),
        getNFTDrops(),
        getTokenSwaps(),
        getLiquidityPools(),
      ]);

      const extract = (r: PromiseSettledResult<any>, cat: string): any[] => {
        if (r.status === "fulfilled") {
          const v = r.value;
          const list = Array.isArray(v) ? v : v?.items ?? v?.collectibles ?? v?.drops ?? v?.pools;
          if (list && list.length > 0) {
            return list.map((i: any) => ({ ...i, __category: cat }));
          }
        }
        return [];
      };

      const combined = [
        ...extract(collectibles, "collectibles"),
        ...extract(drops, "drops"),
        ...extract(swaps, "defi"),
        ...extract(pools, "defi"),
      ];

      setItems(
        combined.length > 0 ? combined : Object.values(FALLBACK_ITEMS).flat()
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = category === "all" ? items : items.filter((i) => i.__category === category);

  const categories: { key: Category; label: string }[] = [
    { key: "all", label: "All" },
    { key: "collectibles", label: "Collectibles" },
    { key: "drops", label: "NFT Drops" },
    { key: "defi", label: "DeFi" },
  ];

  if (loading) {
    return <MarketplaceSkeleton />;
  }

  return (
    <div className="flex-1">
      {/* ── Gradient Mesh Background ─────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-32 -top-32 size-[500px] rounded-full opacity-10 dark:opacity-5"
          style={{ background: "radial-gradient(circle at 30% 50%, oklch(0.55 0.13 290), transparent 70%)", filter: "blur(80px)" }}
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
              <ShoppingBag className="size-3" /> Marketplace
            </span>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Digital Marketplace
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg leading-relaxed">
                Collect digital items, claim NFT drops, and access DeFi
                opportunities — all on Solana.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-4 shadow-premium">
              {[
                { label: "Listings", value: String(items.length), icon: Gem },
                { label: "Volume", value: "48.2 SOL", icon: Coins },
                { label: "Trending", value: "+12%", icon: Flame },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="mb-1 flex justify-center">
                    <stat.icon className="size-4 text-violet-500/60" />
                  </div>
                  <p className="text-sm font-bold tracking-tight">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                  category === c.key
                    ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                    : "bg-background text-muted-foreground border border-border hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Items Grid */}
      <section className="px-6 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            </p>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-3" /> Powered by Solana
            </span>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => (
                <ItemCard key={item?.id ?? `${item?.__category}-${i}`} item={item} category={item.__category ?? "collectibles"} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Info strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid gap-4 sm:grid-cols-2"
          >
            <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
              <div className="mb-2 flex items-center gap-2">
                <Layers className="size-4 text-violet-500/70" />
                <h3 className="text-sm font-semibold">Digital Collectibles</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Own verifiable on-chain collectibles minted on Solana with
                SPL token metadata. Trade and showcase them across the ecosystem.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
              <div className="mb-2 flex items-center gap-2">
                <Coins className="size-4 text-blue-500/70" />
                <h3 className="text-sm font-semibold">DeFi Opportunities</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stake, lend, and provide liquidity through TipChain&apos;s DeFi
                modules to grow your holdings with verifiable yield.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
