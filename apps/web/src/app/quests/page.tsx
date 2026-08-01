"use client";

import {
  Sparkles,
  Trophy,
  Target,
  Coins,
  Heart,
  Share2,
  Users,
  Gift,
  Layers,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── TipPoints quest catalogue (mirrors the TipPoints program) ──────────────

const QUESTS = [
  {
    id: "first-tip",
    title: "First Blood",
    desc: "Send your very first tip to any creator on TipChain.",
    points: 500,
    category: "Starter",
    icon: Heart,
    color: "from-rose-500/10 to-transparent text-rose-400",
  },
  {
    id: "profile",
    title: "Claim your name",
    desc: "Create your creator profile so the world knows who you are.",
    points: 350,
    category: "Starter",
    icon: Users,
    color: "from-emerald-500/10 to-transparent text-emerald-400",
  },
  {
    id: "vault-backer",
    title: "Back a vault",
    desc: "Support a creator vault — your SOL splits across the whole basket.",
    points: 1000,
    category: "Vaults",
    icon: Layers,
    color: "from-violet-500/10 to-transparent text-violet-400",
  },
  {
    id: "vault-builder",
    title: "Found a vault",
    desc: "Create your own curated basket of creators and invite supporters.",
    points: 1500,
    category: "Vaults",
    icon: Trophy,
    color: "from-amber-500/10 to-transparent text-amber-400",
  },
  {
    id: "referral-share",
    title: "Spread the word",
    desc: "Share your referral code with one friend who actually lands.",
    points: 750,
    category: "Community",
    icon: Share2,
    color: "from-cyan-500/10 to-transparent text-cyan-400",
  },
  {
    id: "three-follows",
    title: "Community Builder",
    desc: "Follow three creators and join the TipChain conversation.",
    points: 400,
    category: "Community",
    icon: Users,
    color: "from-fuchsia-500/10 to-transparent text-fuchsia-400",
  },
  {
    id: "ten-tips",
    title: "Ten deep",
    desc: "Send ten tips total — consistency is its own reward.",
    points: 2000,
    category: "Starter",
    icon: Coins,
    color: "from-emerald-500/10 to-transparent text-emerald-400",
  },
  {
    id: "gift-note",
    title: "Say it out loud",
    desc: "Attach a heartfelt message to a tip — words matter as much as SOL.",
    points: 300,
    category: "Community",
    icon: Gift,
    color: "from-rose-500/10 to-transparent text-rose-400",
  },
];

const CATEGORIES = ["All", "Starter", "Vaults", "Community"];

// ─── Motion ─────────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] as const },
};

// ─── Quest card ─────────────────────────────────────────────────────────────

function QuestCard({
  quest,
  index,
  onTrack,
}: {
  quest: (typeof QUESTS)[number];
  index: number;
  onTrack: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.06 }}
    >
      <motion.div
        whileHover={{ y: -5, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        className="group relative h-full overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 transition-all duration-500 hover:border-emerald-500/25 hover:shadow-[0_0_40px_rgba(16,185,129,0.08)]"
      >
        <div className={`mb-5 flex items-center justify-between rounded-2xl bg-gradient-to-b ${quest.color} p-3`}>
          <quest.icon className="size-5" />
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/50">
            {quest.category}
          </span>
        </div>

        <h3 className="mb-2 text-base font-semibold text-white tracking-tight">
          {quest.title}
        </h3>
        <p className="mb-5 text-xs text-white/40 leading-relaxed flex-1">
          {quest.desc}
        </p>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
            <Sparkles className="size-3.5" />
            +{quest.points.toLocaleString()} pts
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTrack(quest.id)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/70 hover:border-emerald-500/40 hover:text-emerald-300 transition-all"
          >
            Track
            <ArrowUpRight className="size-3" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════

export default function QuestsPage() {
  const [category, setCategory] = useState("All");
  const [tracked, setTracked] = useState<Set<string>>(new Set());

  const filtered =
    category === "All"
      ? QUESTS
      : QUESTS.filter((q) => q.category === category);

  const totalPool = QUESTS.reduce((a, q) => a + q.points, 0);

  const trackQuest = (id: string) => {
    setTracked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Ambient */}
      <div className="orb orb-1 -top-40 -right-40 opacity-40" />
      <div className="orb orb-2 -bottom-40 -left-40 opacity-30" />

      {/* Hero */}
      <section className="relative px-6 pt-16 pb-12 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              <Sparkles className="size-3" />
              Earn TipPoints
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-[-0.03em] text-white leading-[1.05] max-w-3xl">
              Little quests,{" "}
              <span className="serif-accent text-emerald-300">real points</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm md:text-base text-white/40 leading-relaxed">
              Complete small, human challenges and earn TipPoints on top of your
              tipping. Points prove your support — quests just make it fun.
            </p>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.15 }}
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl"
          >
            {[
              { label: "Quest pool", value: `${totalPool.toLocaleString()} pts`, icon: Coins },
              { label: "Quests live", value: String(QUESTS.length), icon: Target },
              { label: "Tracked by you", value: String(tracked.size), icon: CheckCircle2 },
              { label: "On-chain", value: "100%", icon: Trophy },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3.5"
              >
                <stat.icon className="mb-2 size-4 text-emerald-400/70" />
                <p className="text-lg font-bold text-white tracking-tight">
                  {stat.value}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-white/30 mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Category filter */}
      <section className="relative px-6 pb-4">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                category === cat
                  ? "bg-emerald-400 text-black"
                  : "border border-white/10 text-white/50 hover:text-white hover:border-white/25"
              }`}
            >
              {cat}
            </motion.button>
          ))}
          <span className="ml-auto hidden sm:block text-[11px] text-white/25">
            Progress is tracked locally for now — on-chain verification lands with v4
          </span>
        </div>
      </section>

      {/* Grid */}
      <section className="relative px-6 py-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((quest, i) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  index={i}
                  onTrack={trackQuest}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Season strip */}
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.2 }}
            className="mt-12 grid gap-4 sm:grid-cols-2"
          >
            <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-violet-500/8 to-transparent p-6">
              <div className="mb-2 flex items-center gap-2">
                <Layers className="size-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Seasons rotate</h3>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                Quests refresh each season with fresh rewards and exclusive
                badges for the people who actually show up.
              </p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-500/8 to-transparent p-6">
              <div className="mb-2 flex items-center gap-2">
                <Trophy className="size-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Points feed the leaderboard</h3>
              </div>
              <p className="text-xs text-white/40 leading-relaxed mb-4">
                Every quest point stacks on top of your tipping points. See where
                you stand among the most supportive people on Solana.
              </p>
              <Link href="/points">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                  Understand TipPoints <ArrowUpRight className="size-3" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
