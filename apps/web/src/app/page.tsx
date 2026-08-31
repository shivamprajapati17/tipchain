"use client";

import { motion } from "framer-motion";
import { ArrowRight, Send, Wallet, Users, TrendingUp, Heart } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number] },
};

const STEPS = [
  {
    icon: Wallet,
    title: "Connect your wallet",
    description: "Link your Solana wallet in one click. No accounts or sign-ups needed.",
  },
  {
    icon: Users,
    title: "Find a creator",
    description: "Browse creator profiles and find someone you want to support.",
  },
  {
    icon: Send,
    title: "Send a tip",
    description: "Choose SOL or USDC, add a message, and send. It lands in seconds.",
  },
];

const FEATURES = [
  {
    icon: Send,
    title: "Instant transfers",
    description: "Tips land in the creator's wallet in seconds. Built on Solana for speed and low fees.",
  },
  {
    icon: Heart,
    title: "Messages that matter",
    description: "Every tip can carry a message. Tell a creator why you support them.",
  },
  {
    icon: TrendingUp,
    title: "Track everything",
    description: "See your full tipping history — who you've supported, how much, and when.",
  },
  {
    icon: Users,
    title: "Creator profiles",
    description: "Every creator gets a profile with their wallet, bio, and history of support.",
  },
];

export default function Home() {
  return (
    <main className="overflow-x-hidden w-full max-w-full flex-1">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Ambient orbs */}
        <div className="orb orb-1 -top-40 -left-40 opacity-50" />
        <div className="orb orb-2 -bottom-40 -right-40 opacity-40" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-400 mb-6">
              Solana Native
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="text-[clamp(2.2rem,5.5vw,4.5rem)] leading-[1.05] font-bold tracking-[-0.04em] text-white"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Tip the creators
            <br />
            <span className="text-gradient-emerald">you love</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="mx-auto mt-6 max-w-xl text-sm md:text-base text-white/50 leading-relaxed"
          >
            Send SOL or USDC tips directly to creators on Solana.
            Every transaction is on-chain, transparent, and instant. No middlemen, no fees.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="/creators"
              className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-emerald-400 text-black text-sm font-semibold hover:bg-emerald-300 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.45)]"
            >
              Start tipping
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/creators"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl glass-card text-white/80 text-sm font-medium hover:text-white hover:bg-white/10 transition-all"
            >
              Browse creators
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-14 flex justify-center gap-8 text-white/30"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500/50" />
              Solana Devnet
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500/50" />
              0% Fees
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500/50" />
              On-chain
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div {...fadeUp} className="mb-14 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.08]">
              Simple as <span className="serif-accent text-emerald-300">1, 2, 3</span>
            </h2>
            <p className="mt-4 text-sm text-white/40 max-w-md mx-auto">
              No accounts, no middlemen. Just connect, find, and tip.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center"
              >
                <div className="mb-4 inline-flex items-center justify-center size-12 rounded-xl bg-emerald-500/10">
                  <step.icon className="size-5 text-emerald-400" />
                </div>
                <div className="mb-2 text-xs font-semibold text-emerald-400/80">
                  Step {i + 1}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div {...fadeUp} className="mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.05]">
              Built for <span className="serif-accent text-emerald-300">real support</span>
            </h2>
            <p className="mt-4 text-sm text-white/40 max-w-md">
              Simple, direct tipping on Solana. No farming games, no inflated stats.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-emerald-500/20 transition-all duration-300"
              >
                <div className="mb-3 inline-flex items-center justify-center size-9 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-colors">
                  <feature.icon className="size-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{feature.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-white/5">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.05]">
              Ready to support someone?
            </h2>
            <p className="mt-5 text-sm text-white/45 leading-relaxed max-w-md mx-auto">
              Connect your wallet, pick a creator, and send your first tip.
              It takes ten seconds and it means everything.
            </p>
            <div className="mt-10">
              <a
                href="/creators"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-400 text-black text-sm font-semibold hover:bg-emerald-300 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.45)]"
              >
                Find a creator
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
