"use client";

import { useWallet, useWalletSession, useBalance } from "@solana/react-hooks";
import { Button } from "@/components/ui/button";
import {
  Coins,
  ArrowRight,
  Zap,
  Globe,
  Heart,
  Shield,
  TrendingUp,
  Wallet,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Motion Variants ────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
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

const blurReveal = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" as const },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)" as const,
    transition: { type: "spring" as const, stiffness: 60, damping: 24, mass: 0.8 },
  },
} as const;

const fadeSlideLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 24 },
  },
} as const;

const fadeSlideRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 24 },
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

// ─── Mock Data ──────────────────────────────────────────────────────────────

const FEATURED_CREATORS = [
  {
    username: "rahul",
    displayName: "Rahul Sharma",
    bio: "Full-stack developer & Solana enthusiast. Building the next generation of decentralized apps.",
    totalTips: "12.5 SOL",
    supporters: 24,
    featured: true,
  },
  {
    username: "priya",
    displayName: "Priya Patel",
    bio: "Digital artist & NFT creator pushing the boundaries of generative art on Solana.",
    totalTips: "8.3 SOL",
    supporters: 19,
    featured: false,
  },
  {
    username: "arjun",
    displayName: "Arjun Singh",
    bio: "Open source contributor & Rust dev. Building tooling for the Solana ecosystem.",
    totalTips: "5.7 SOL",
    supporters: 15,
    featured: false,
  },
];

const BENEFITS = [
  {
    icon: Zap,
    title: "Instant Transactions",
    description:
      "Tips arrive in seconds with Solana's lightning-fast confirmation times. No waiting, no delays.",
  },
  {
    icon: Shield,
    title: "Zero Platform Fees",
    description:
      "Every lamport goes directly to creators. No middlemen taking a cut of your hard-earned support.",
  },
  {
    icon: TrendingUp,
    title: "On-Chain Transparency",
    description:
      "Every tip is recorded on Solana. Verifiable, immutable, and always accessible to the public.",
  },
  {
    icon: Heart,
    title: "Direct Connection",
    description:
      "Build real relationships with fans through direct wallet-to-wallet transactions and optional messages.",
  },
];

const FAQS = [
  {
    q: "What is TipChain?",
    a: "TipChain is a decentralized creator tipping platform built on Solana. It enables fans to send tips directly to creators using crypto wallets — no middlemen, no platform fees.",
  },
  {
    q: "How do I receive tips?",
    a: "Connect your Solana wallet, create your profile, and share your unique TipChain link. Supporters can then send you SOL or USDC directly to your wallet.",
  },
  {
    q: "What wallets are supported?",
    a: "TipChain supports Phantom, Solflare, and Backpack wallets. If you have any Solana wallet installed as a browser extension, it should work.",
  },
  {
    q: "Are there any fees?",
    a: "No platform fees. The only cost is the Solana network transaction fee (typically less than $0.01 per transaction). 100% of your tips go directly to you.",
  },
  {
    q: "Can I send tips in USDC?",
    a: "Yes! Supporters can send both SOL and USDC tips. All transactions are recorded on-chain and are fully transparent and verifiable.",
  },
  {
    q: "How do I withdraw my tips?",
    a: "Tips are sent directly to your connected Solana wallet. You have full control over your funds and can manage them through your wallet at any time.",
  },
];

// ─── Perpetual Pulse Dot ────────────────────────────────────────────────────

const PulseDot = memo(function PulseDot() {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-emerald-500"
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
});

// ─── Typewriter Badge ───────────────────────────────────────────────────────

function TypewriterBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
      className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/50 bg-emerald-50/50 px-4 py-1.5 text-xs font-medium text-emerald-700"
    >
      <PulseDot />
      Built on Solana
    </motion.div>
  );
}

// ─── Gradient Mesh Background ───────────────────────────────────────────────

function GradientMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large emerald blob */}
      <motion.div
        className="absolute -right-32 -top-32 size-[600px] rounded-full opacity-15"
        style={{
          background:
            "radial-gradient(circle at 30% 50%, oklch(0.45 0.12 160), transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Secondary warm blob */}
      <motion.div
        className="absolute -bottom-40 -left-20 size-[500px] rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle at 70% 50%, oklch(0.55 0.10 160), transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          x: [0, -30, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Subtle noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />
    </div>
  );
}

// ─── Hero Section (Split-Screen) ────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] overflow-hidden">
      <GradientMesh />

      {/* Floating emerald card decorations */}
      <motion.div
        className="pointer-events-none absolute right-[15%] top-[20%] hidden rounded-2xl border border-emerald-200/20 bg-white/60 p-4 shadow-premium backdrop-blur-sm lg:block"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 20, delay: 1.2 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Heart className="size-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold">+2.5 SOL received</p>
            <p className="text-[10px] text-muted-foreground">Just now</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute right-[5%] top-[45%] hidden rounded-2xl border border-emerald-200/20 bg-white/60 p-4 shadow-premium backdrop-blur-sm lg:block"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 20, delay: 1.6 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Users className="size-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold">24 new supporters</p>
            <p className="text-[10px] text-muted-foreground">This week</p>
          </div>
        </div>
      </motion.div>

      <div className="relative mx-auto grid min-h-[100dvh] max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:px-8">
        {/* Left — Content */}
        <motion.div
          className="pt-24 lg:pt-0"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <TypewriterBadge />

          <motion.h1
            variants={fadeSlideLeft}
            className="max-w-xl text-4xl font-bold tracking-tighter text-foreground sm:text-5xl md:text-6xl lg:text-7xl leading-[0.9]"
          >
            Support Creators
            <span className="mt-2 block text-emerald-600">Directly</span>
          </motion.h1>

          <motion.p
            variants={fadeSlideLeft}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            No middlemen. No platform fees. Every tip goes straight to the
            creators you love — verified on Solana in seconds.
          </motion.p>

          <motion.div
            variants={fadeSlideUp}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <Link href="/profile">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="gap-2 rounded-xl px-6 py-3 text-base shadow-premium">
                  Start Receiving Tips
                  <ArrowRight className="size-4" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/creators">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" size="lg" className="gap-2 rounded-xl px-6 py-3 text-base">
                  <Globe className="size-4" />
                  Explore Creators
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeSlideUp}
            className="mt-12 flex flex-wrap items-center gap-6"
          >
            {[
              { label: "Transactions", value: "10K+" },
              { label: "Creators", value: "200+" },
              { label: "SOL Tipped", value: "26.5K" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-foreground">
                  {stat.value}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — Visual */}
        <motion.div
          className="relative hidden lg:block"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 60, damping: 24, delay: 0.5 }}
        >
          <div className="relative mx-auto aspect-square max-w-lg">
            {/* Central gradient ring */}
            <motion.div
              className="absolute inset-[15%] rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, oklch(0.45 0.12 160 / 0.3), oklch(0.55 0.10 160 / 0.1), oklch(0.35 0.08 160 / 0.3), oklch(0.55 0.10 160 / 0.2), oklch(0.45 0.12 160 / 0.3))",
                filter: "blur(4px)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Center content */}
            <div className="absolute inset-[30%] flex items-center justify-center">
              <div className="flex size-full items-center justify-center rounded-full bg-white shadow-premium-lg">
                <motion.div
                  className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 oklch(0.45 0.12 160 / 0.4)",
                      "0 0 0 20px oklch(0.45 0.12 160 / 0)",
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <Coins className="size-10 text-white" />
                </motion.div>
              </div>
            </div>

            {/* Orbiting dots */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 size-3 rounded-full bg-emerald-500/40"
                style={{
                  boxShadow: "0 0 12px oklch(0.45 0.12 160 / 0.3)",
                }}
                animate={{
                  x: [
                    0,
                    Math.cos((i * 2 * Math.PI) / 3) * 140,
                    Math.cos((i * 2 * Math.PI) / 3 + Math.PI) * 140,
                    Math.cos((i * 2 * Math.PI) / 3) * 0,
                  ],
                  y: [
                    0,
                    Math.sin((i * 2 * Math.PI) / 3) * 140,
                    Math.sin((i * 2 * Math.PI) / 3 + Math.PI) * 140,
                    Math.sin((i * 2 * Math.PI) / 3) * 0,
                  ],
                  opacity: [0, 0.6, 0.6, 0],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Wallet Status + Stats ──────────────────────────────────────────────────

function WalletStatus() {
  const { status } = useWallet();
  const session = useWalletSession();
  const { lamports, fetching } = useBalance(session?.account.address, {
    fetch: true,
    watch: true,
  });

  if (status !== "connected" || !session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="rounded-2xl border border-border bg-card p-8 text-center shadow-premium"
      >
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-50">
          <Coins className="size-8 text-emerald-500" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Connect Your Wallet</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Connect a Solana wallet to start sending and receiving tips on
          TipChain.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-premium"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <Wallet className="size-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium">Wallet Connected</p>
          <p className="font-mono text-xs text-muted-foreground">
            {session.account.address.slice(0, 8)}...
            {session.account.address.slice(-8)}
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">Balance</p>
        <p className="text-2xl font-bold">
          {fetching
            ? "..."
            : lamports !== null
              ? `${(Number(lamports) / 1e9).toFixed(4)} SOL`
              : "—"}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Creator Card (Asymmetric Bento) ────────────────────────────────────────

function CreatorCard({
  creator,
  isFeatured,
}: {
  creator: (typeof FEATURED_CREATORS)[number];
  isFeatured?: boolean;
}) {
  const initials = creator.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      variants={fadeSlideUp}
      whileHover={{ y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } }}
    >
      <Link
        href={`/creator/${creator.username}`}          className={`group block h-full ${isFeatured ? "sm:col-span-2" : ""}`}
        >
          <div
            className={`relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-premium hover-glass-strong ${
            isFeatured ? "sm:p-8" : ""
          }`}
        >
          {/* Hover gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="relative">
            <div
              className={`mb-4 flex items-center gap-4 ${isFeatured ? "sm:mb-6" : ""}`}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`flex shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 font-bold text-emerald-600/70 ${
                  isFeatured ? "size-16 text-xl" : "size-12"
                }`}
              >
                {initials}
              </motion.div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3
                    className={`font-semibold ${isFeatured ? "text-lg" : "text-sm"}`}
                  >
                    {creator.displayName}
                  </h3>
                  <PulseDot />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  @{creator.username}
                </p>
              </div>
            </div>

            <p
              className={`mb-4 text-muted-foreground leading-relaxed line-clamp-2 ${
                isFeatured ? "text-sm" : "text-xs"
              }`}
            >
              {creator.bio}
            </p>

            <div className="flex items-center gap-4 border-t border-border pt-4">
              <div>
                <p className="text-sm font-semibold">{creator.totalTips}</p>
                <p className="text-[10px] text-muted-foreground">Earned</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{creator.supporters}</p>
                <p className="text-[10px] text-muted-foreground">Supporters</p>
              </div>
              <motion.div
                className="ml-auto opacity-0 group-hover:opacity-100"
                initial={{ x: -5 }}
                whileHover={{ x: 2 }}
              >
                <ExternalLink className="size-4 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Benefit Card ───────────────────────────────────────────────────────────

function BenefitCard({
  benefit,
  index,
}: {
  benefit: (typeof BENEFITS)[number];
  index: number;
}) {
  return (
    <motion.div
      variants={blurReveal}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      className="group"
    >
      <div className="rounded-2xl border border-border bg-gradient-to-b from-muted/20 to-muted/5 p-[2px] shadow-premium hover-glass-strong">
        <div className="rounded-[calc(1.5rem-3px)] bg-card p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <motion.div
            className="mb-4 flex size-11 items-center justify-center rounded-xl bg-emerald-500/5 transition-colors duration-300 group-hover:bg-emerald-500/10"
            whileHover={{ scale: 1.1, rotate: -3 }}
          >
            <benefit.icon className="size-5.5 text-emerald-600" />
          </motion.div>
          <h3 className="mb-2 text-sm font-semibold">{benefit.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {benefit.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── FAQ Accordion ──────────────────────────────────────────────────────────

function FAQItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: (typeof FAQS)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors duration-200 hover:bg-muted/20"
      >
        <span className="text-sm font-medium pr-4">{faq.q}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="size-4 shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Section Badge ──────────────────────────────────────────────────────────

function SectionBadge({ label }: { label: string }) {
  return (
    <motion.div
      variants={fadeSlideUp}
      className="mb-2 flex justify-center sm:justify-start"
    >
      <span className="inline-flex items-center rounded-full border border-border bg-background/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
    </motion.div>
  );
}

// ─── Main Home Page ────────────────────────────────────────────────────────

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />

      {/* ── Wallet + Quick Stats ─────────────────────────────────────────── */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto w-full max-w-lg px-6 pb-24 pt-8"
      >
        <WalletStatus />

        <motion.div
          variants={fadeSlideUp}
          className="mt-6 grid grid-cols-3 gap-4"
        >
          {[
            { label: "Total Tipped", value: "26.5 SOL" },
            { label: "Creators", value: "3" },
            { label: "Transactions", value: "107" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-4 text-center shadow-premium"
            >
              <p className="text-lg font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* ── Featured Creators (Asymmetric Bento) ─────────────────────────── */}
      <section className="border-t border-border bg-muted/30 px-6 py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-6xl"
        >
          <div className="mb-2 text-center sm:text-left">
            <span className="inline-flex items-center rounded-full border border-border bg-background/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Featured
            </span>
          </div>
          <motion.h2
            variants={fadeSlideLeft}
            className="mb-2 text-center text-3xl font-bold tracking-tight sm:text-left sm:text-4xl"
          >
            Creators on TipChain
          </motion.h2>
          <motion.p
            variants={fadeSlideLeft}
            className="mx-auto mb-10 max-w-md text-center text-sm text-muted-foreground sm:mx-0 sm:text-left"
          >
            Discover and support amazing creators building on Solana
          </motion.p>

          {/* Asymmetric grid: featured creator spans 2 cols, others grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_CREATORS.map((creator, i) => (
              <CreatorCard
                key={creator.username}
                creator={creator}
                isFeatured={i === 0}
              />
            ))}
          </div>              <motion.div variants={blurReveal} className="mt-10 text-center">
                <Link href="/creators">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button variant="outline" className="group gap-2 rounded-xl px-5">
                      View All Creators
                      <motion.span
                        className="inline-block"
                        whileHover={{ x: 3 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <ArrowRight className="size-4" />
                      </motion.span>
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
        </motion.div>
      </section>

      {/* ── Benefits (2x2 Bento Grid) ────────────────────────────────────── */}
      <section className="px-6 py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-6xl"
        >
          <SectionBadge label="Why TipChain" />
          <motion.h2
            variants={blurReveal}
            className="mb-2 text-center text-3xl font-bold tracking-tight sm:text-left sm:text-4xl"
          >
            Built for Creators
          </motion.h2>
          <motion.p
            variants={blurReveal}
            className="mx-auto mb-12 max-w-lg text-center text-sm text-muted-foreground sm:mx-0 sm:text-left"
          >
            Everything you need to earn directly from your supporters
          </motion.p>

          <div className="grid gap-5 sm:grid-cols-2">
            {BENEFITS.map((benefit, i) => (
              <BenefitCard key={benefit.title} benefit={benefit} index={i} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── How It Works (Zig-Zag) ───────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30 px-6 py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-4xl"
        >
          <SectionBadge label="Getting Started" />
          <motion.h2
            variants={blurReveal}
            className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-left sm:text-4xl"
          >
            How It Works
          </motion.h2>

          <div className="space-y-10">
            {[
              {
                icon: Wallet,
                step: "01",
                title: "Connect Wallet",
                description:
                  "Connect your Solana wallet like Phantom or Solflare to get started in seconds.",
                align: "left",
              },
              {
                icon: Sparkles,
                step: "02",
                title: "Find Creators",
                description:
                  "Browse creator profiles and discover amazing work you want to support.",
                align: "right",
              },
              {
                icon: Coins,
                step: "03",
                title: "Send Tips",
                description:
                  "Send SOL or USDC tips directly — instantly confirmed, with zero platform fees.",
                align: "left",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeSlideUp}
                className={`flex flex-col gap-6 ${
                  item.align === "right"
                    ? "sm:flex-row-reverse"
                    : "sm:flex-row"
                } items-center`}
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-premium"
                >
                  <item.icon className="size-8 text-emerald-600" />
                </motion.div>
                <div
                  className={`flex-1 ${item.align === "right" ? "sm:text-right" : ""}`}
                >
                  <p className="mb-1 text-xs font-semibold tracking-wider text-emerald-600">
                    Step {item.step}
                  </p>
                  <h3 className="mb-2 text-xl font-bold tracking-tight">
                    {item.title}
                  </h3>
                  <p
                    className={`text-sm text-muted-foreground leading-relaxed ${
                      item.align === "right"
                        ? "sm:ml-auto"
                        : ""
                    } max-w-md`}
                  >
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-3xl"
        >
          <SectionBadge label="FAQ" />
          <motion.h2
            variants={fadeSlideLeft}
            className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-left sm:text-4xl"
          >
            Frequently Asked Questions
          </motion.h2>

          <motion.div
            variants={fadeSlideUp}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-premium"
          >
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border bg-muted/30 px-6 py-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -right-40 -top-40 size-[400px] rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, oklch(0.45 0.12 160), transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="relative mx-auto max-w-2xl text-center"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Start?
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Join the creator economy on Solana. Connect your wallet and start
            receiving tips in minutes.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/profile">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="gap-2 rounded-xl px-8 py-3 text-base shadow-premium">
                  Start Receiving Tips
                  <ArrowRight className="size-4" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/creators">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" size="lg" className="gap-2 rounded-xl px-8 py-3 text-base">
                  <Globe className="size-4" />
                  Explore Creators
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold">
              T
            </div>
            <span className="text-xs text-muted-foreground">
              TipChain &mdash; Support Creators Directly
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Powered by Solana</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Missing import ─────────────────────────────────────────────────────────

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}
