"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Coins,
  TrendingUp,
  Bot,
  Gamepad2,
  Trophy,
  Users,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gift,
  Shield,
  Heart,
  Quote,
} from "lucide-react";

// ─── Motion primitives ──────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] as const },
};

const stagger = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] as const },
};

// ═══════════════════════════════════════════════════════════════════════════
//  ATTENTION — Cinematic hero (2-3 line H1, no badges, no raw stats)
// ═══════════════════════════════════════════════════════════════════════════

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.15]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <section ref={ref} className="relative min-h-[92vh] overflow-hidden flex items-center justify-center">
      {/* Full-bleed background with dark radial wash */}
      <motion.div
        style={{ scale: bgScale, opacity: bgOpacity }}
        className="absolute inset-0"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://picsum.photos/seed/tipchainvault/1920/1080)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/70 via-[#0a0a0f]/85 to-[#0a0a0f]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 40%, transparent 0%, rgba(10,10,15,0.9) 100%)",
          }}
        />
      </motion.div>

      {/* Ambient orbs */}
      <div className="orb orb-1 -top-40 -left-40 opacity-60" />
      <div className="orb orb-2 -bottom-40 -right-40 opacity-50" />

      <motion.div
        style={{ y: textY }}
        className="relative z-10 mx-auto max-w-6xl px-6 pt-10 pb-24 text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="text-[clamp(2.6rem,6vw,5.2rem)] leading-[1.02] font-bold tracking-[-0.04em] text-white"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          Tip the creators you love,
          <br />
          earn{" "}
          <span
            className="inline-block w-20 h-9 -mb-2 rounded-full bg-cover bg-center mx-1 align-middle ring-1 ring-white/20"
            style={{ backgroundImage: "url(https://picsum.photos/seed/tipsparkle/200/80)" }}
          />
          <span className="text-gradient-emerald">points</span> that prove it
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.8 }}
          className="mx-auto mt-7 max-w-2xl text-base md:text-lg text-white/50 leading-relaxed"
        >
          TipChain is the human-first creator economy on Solana. Every tip is a
          signal, every point is proof — and every vault turns fans into a
          shared fund.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="/creators"
            className="group inline-flex items-center justify-center gap-2 h-13 px-8 py-4 rounded-2xl bg-emerald-400 text-black text-sm font-semibold hover:bg-emerald-300 transition-all shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]"
          >
            Start tipping
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="/vaults"
            className="group inline-flex items-center justify-center gap-2 h-13 px-8 py-4 rounded-2xl glass-card text-white/80 text-sm font-medium hover:text-white hover:bg-white/10 transition-all"
          >
            <Layers className="size-4" />
            Explore vaults
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-16 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1 text-white/25"
          >
            <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
            <ChevronDown className="size-4" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  INTEREST — Infinite marquee of core actions
// ═══════════════════════════════════════════════════════════════════════════

const MARQUEE_ITEMS = [
  "Tip in SOL",
  "Earn TipPoints",
  "Back a vault",
  "Share a referral",
  "Climb the leaderboard",
  "Follow creators",
  "Send a message",
  "Prove it on-chain",
];

function Marquee() {
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <section className="relative border-y border-white/5 overflow-hidden py-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[#0a0a0f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[#0a0a0f] to-transparent" />
      <div className="marquee-track">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-6 px-6 text-sm md:text-base text-white/25 font-medium whitespace-nowrap"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            <Heart className="size-3.5 text-emerald-500/40" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  INTEREST — Gapless bento (grid-flow-dense, interlocking spans, no voids)
// ═══════════════════════════════════════════════════════════════════════════

const BENTO = [
  {
    span: "lg:col-span-7 lg:row-span-2",
    icon: Coins,
    title: "Tip with meaning",
    desc: "Attach a message, send SOL or USDC, and leave a permanent record on Solana. No accounts, no walls — just support.",
    image: "https://picsum.photos/seed/tipexchange/1000/900",
    gradient: "from-emerald-500/10 via-transparent to-transparent",
    iconColor: "text-emerald-400 bg-emerald-500/10",
  },
  {
    span: "lg:col-span-5",
    icon: Trophy,
    title: "TipPoints",
    desc: "Every SOL of activity earns 1,000 points. Rise from Bronze to Hyper and show the world how much you care.",
    image: "https://picsum.photos/seed/tiptrophy/600/420",
    gradient: "from-amber-500/10 via-transparent to-transparent",
    iconColor: "text-amber-400 bg-amber-500/10",
  },
  {
    span: "lg:col-span-5",
    icon: Layers,
    title: "Creator vaults",
    desc: "Fund a curated basket of creators in one move. Your SOL splits across them by the weights you choose.",
    image: "https://picsum.photos/seed/tipvault/600/420",
    gradient: "from-violet-500/10 via-transparent to-transparent",
    iconColor: "text-violet-400 bg-violet-500/10",
  },
  {
    span: "lg:col-span-7 lg:row-span-2",
    icon: Gift,
    title: "Referrals that pay",
    desc: "Share your code, grow the circle, and earn commission on every referral you bring home.",
    image: "https://picsum.photos/seed/tipgift/1000/900",
    gradient: "from-cyan-500/10 via-transparent to-transparent",
    iconColor: "text-cyan-400 bg-cyan-500/10",
  },
  {
    span: "lg:col-span-5",
    icon: Users,
    title: "A real community",
    desc: "Follow creators, read their updates, and feel the warmth of a platform built around humans — not hype.",
    image: "https://picsum.photos/seed/tipcommunity/600/420",
    gradient: "from-fuchsia-500/10 via-transparent to-transparent",
    iconColor: "text-fuchsia-400 bg-fuchsia-500/10",
  },
  {
    span: "lg:col-span-5",
    icon: Shield,
    title: "Verifiable, always",
    desc: "Every tip, point, and payout maps to an on-chain transaction. Trust is not claimed — it is proven.",
    image: "https://picsum.photos/seed/tipshield/600/420",
    gradient: "from-emerald-500/5 via-transparent to-transparent",
    iconColor: "text-emerald-400 bg-emerald-500/10",
  },
];

function Bento() {
  return (
    <section className="section-chapter relative overflow-hidden">
      <div className="absolute inset-0 grid-backdrop opacity-20" />
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <motion.div {...fadeUp} className="mb-16 max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.03em] text-white leading-[1.05]">
            Everything you need to{" "}
            <span className="serif-accent text-emerald-300">show up</span> for
            the people you believe in
          </h2>
          <p className="mt-5 text-sm md:text-base text-white/40 leading-relaxed max-w-xl">
            Six primitives, one human-first economy. No farming games, no
            inflated stats — just genuine support, beautifully surfaced.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 lg:grid-flow-dense gap-4">
          {BENTO.map((card, i) => (
            <motion.a
              key={card.title}
              href={
                card.title === "TipPoints"
                  ? "/points"
                  : card.title === "Creator vaults"
                    ? "/vaults"
                    : card.title === "Referrals that pay"
                      ? "/referrals"
                      : card.title === "A real community"
                        ? "/creators"
                        : card.title === "Verifiable, always"
                          ? "/leaderboard"
                          : "/creators"
              }
              {...stagger}
              transition={{
                ...stagger.transition,
                delay: i * 0.05,
              }}
              className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br ${card.gradient} bg-white/[0.02] p-6 md:p-8 transition-all duration-500 hover:border-emerald-500/25 hover:bg-white/[0.04] ${card.span}`}
            >
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={card.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-25 grayscale contrast-125 group-hover:opacity-40 group-hover:grayscale-0 transition-all duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
              </div>

              <div className="relative z-10 flex h-full min-h-[14rem] flex-col justify-end">
                <div className={`mb-4 flex items-center justify-center size-10 rounded-xl ${card.iconColor} group-hover:scale-110 transition-transform`}>
                  <card.icon className="size-5" />
                </div>
                <h3 className="text-lg md:text-2xl font-semibold text-white mb-2 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-xs md:text-sm text-white/45 leading-relaxed max-w-md">
                  {card.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  Explore <ArrowRight className="size-3" />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DESIRE — Pinned section: sticky title + scrolling proof gallery
// ═══════════════════════════════════════════════════════════════════════════

const PROOF_ITEMS = [
  { icon: TrendingUp, title: "Live leaderboards", body: "See who shows up most — in SOL and in TipPoints — updated from real transactions." },
  { icon: Bot, title: "AI that helps, not sells", body: "A creator assistant that drafts messages and helps you grow, without hype." },
  { icon: Gamepad2, title: "Quests worth doing", body: "Small, human challenges that reward real behaviour — not empty grinding." },
  { icon: Sparkles, title: "Moments that matter", body: "Milestones, badges and warm signals that celebrate every level of support." },
];

function ProofCard({
  item,
  index,
  total,
  scrollYProgress,
}: {
  item: (typeof PROOF_ITEMS)[number];
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const scale = useTransform(scrollYProgress, [start, end], [0.82, 1]);
  const opacity = useTransform(scrollYProgress, [start, end], [0.25, 1]);

  return (
    <motion.div
      style={{ scale, opacity }}
      className="group rounded-3xl border border-white/8 bg-white/[0.03] p-7 backdrop-blur-sm hover:border-emerald-500/25 transition-colors duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center size-11 rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0">
          <item.icon className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1.5">{item.title}</h3>
          <p className="text-sm text-white/45 leading-relaxed">{item.body}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ProofGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });

  return (
    <section ref={ref} className="section-chapter relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12">
          {/* Sticky title */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <motion.h2
              style={{ opacity: scrollYProgress }}
              className="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.05] mb-5"
            >
              Built on{" "}
              <span className="text-gradient-emerald">proof</span>,
              <br />
              <span className="serif-accent text-white/80">not promises</span>
            </motion.h2>
            <p className="text-sm text-white/40 leading-relaxed max-w-sm">
              Every feature is a transaction waiting to happen. Scroll through
              what TipChain actually does — then go do it.
            </p>
          </div>

          {/* Scrolling proof cards with scale/fade */}
          <div className="space-y-5">
            {PROOF_ITEMS.map((item, i) => (
              <ProofCard
                key={item.title}
                item={item}
                index={i}
                total={PROOF_ITEMS.length}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DESIRE — Scrubbed word reveal
// ═══════════════════════════════════════════════════════════════════════════

const REVEAL_TEXT =
  "TipChain turns the act of tipping into a language of its own — every coin, every message, every shared vault says something real about the people you back and the economy you choose to build together.";

const REVEAL_WORDS = REVEAL_TEXT.split(" ");

function RevealWord({
  word,
  index,
  total,
  scrollYProgress,
}: {
  word: string;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(scrollYProgress, [start, end], [0.08, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block mr-[0.28em]">
      {word}
    </motion.span>
  );
}

function ScrubbedReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });

  return (
    <section ref={ref} className="section-chapter relative overflow-hidden border-t border-white/5">
      <div className="orb orb-3 -top-40 left-1/2 -translate-x-1/2 opacity-40" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-10 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400/80"
        >
          The TipChain philosophy
        </motion.h2>
        <p className="text-2xl md:text-4xl leading-snug font-medium text-white/90 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          {REVEAL_WORDS.map((word, i) => (
            <RevealWord
              key={i}
              word={word}
              index={i}
              total={REVEAL_WORDS.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DESIRE — Testimonial carousel (human voices)
// ═══════════════════════════════════════════════════════════════════════════

const TESTIMONIALS = [
  {
    quote:
      "The first tip I sent came with a message the creator replied to the same day. It felt like a letter, not a transaction.",
    name: "Maya R.",
    role: "Supporter since day one",
    image: "https://picsum.photos/seed/maya/120/120",
  },
  {
    quote:
      "TipPoints turned my support into something I can see and feel. Climbing from Bronze to Gold is strangely motivating.",
    name: "Dev K.",
    role: "TipPoints Bronze → Gold",
    image: "https://picsum.photos/seed/devk/120/120",
  },
  {
    quote:
      "I backed a vault of five creators with one tip and each of them thanked me. That simply does not happen anywhere else.",
    name: "Priya S.",
    role: "Vault supporter",
    image: "https://picsum.photos/seed/priya/120/120",
  },
  {
    quote:
      "My referral code brought three friends, and the commission came through exactly as promised. No fine print, no games.",
    name: "Arjun M.",
    role: "Referral partner",
    image: "https://picsum.photos/seed/arjun/120/120",
  },
];

function Testimonials() {
  const [index, setIndex] = useState(0);
  const t = TESTIMONIALS[index];

  const go = (dir: number) => {
    setIndex((prev) => (prev + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  // Auto-advance every 6s; the interval re-arms on manual navigation too
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(id);
  }, [index]);

  return (
    <section className="section-chapter relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 grid-backdrop opacity-20" />
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <motion.div {...fadeUp} className="mb-14 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.08]">
            People, <span className="serif-accent text-emerald-300">not just wallets</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Overlapping portraits */}
          <div className="flex items-center justify-center mb-10 -space-x-4">
            {TESTIMONIALS.map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                onClick={() => setIndex(i)}
                className={`relative size-14 rounded-full ring-2 transition-all duration-300 cursor-pointer ${
                  i === index
                    ? "ring-emerald-400 scale-110 z-10"
                    : "ring-white/20 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="size-full rounded-full object-cover grayscale-[0.4]"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>

          {/* Quote card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-8 md:p-12 backdrop-blur-sm">
            <Quote className="absolute top-6 left-6 size-10 text-emerald-500/15" />
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="relative text-center"
              >
                <p className="text-lg md:text-2xl leading-relaxed text-white/85 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-6">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/35 mt-0.5">{t.role}</p>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-emerald-500/40 transition-all"
            >
              <ChevronLeft className="size-4" />
            </motion.button>
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-emerald-400" : "w-2 bg-white/15 hover:bg-white/30"
                  }`}
                />
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => go(1)}
              aria-label="Next testimonial"
              className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-emerald-500/40 transition-all"
            >
              <ChevronRight className="size-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ACTION — Final CTA
// ═══════════════════════════════════════════════════════════════════════════

function FinalCTA() {
  return (
    <section className="section-chapter relative overflow-hidden border-t border-white/5">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: "url(https://picsum.photos/seed/tipfinal/1920/600)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/70 to-[#0a0a0f]" />
      <div className="orb orb-1 -bottom-60 left-1/4 opacity-50" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.div {...fadeUp}>
          <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.03em] text-white leading-[1.05]">
            Your next tip could be{" "}
            <span className="serif-accent text-emerald-300">someone's day</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-sm md:text-base text-white/45 leading-relaxed">
            Connect your wallet, pick a creator you believe in, and send the
            first tip. It takes ten seconds and it means everything.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/creators"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-emerald-400 text-black text-sm font-semibold hover:bg-emerald-300 transition-all shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]"
            >
              Find a creator
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass-card text-white/80 text-sm font-medium hover:text-white hover:bg-white/10 transition-all"
            >
              Open dashboard
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN — AIDA flow, footer lives in the root layout
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  return (
    <main className="overflow-x-hidden w-full max-w-full flex-1">
      <Hero />
      <Marquee />
      <Bento />
      <ProofGallery />
      <ScrubbedReveal />
      <Testimonials />
      <FinalCTA />
    </main>
  );
}
