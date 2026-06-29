"use client";

import { ArrowRight } from "@phosphor-icons/react";

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

const FEATURED_CREATORS = [
  {
    username: "rahul",
    displayName: "Rahul Sharma",
    bio: "Full-stack developer & Solana enthusiast",
    totalTips: "12.5 SOL",
    supporters: 24,
  },
  {
    username: "priya",
    displayName: "Priya Patel",
    bio: "Digital artist & NFT creator on Solana",
    totalTips: "8.3 SOL",
    supporters: 19,
  },
  {
    username: "arjun",
    displayName: "Arjun Singh",
    bio: "Open source contributor & Rust dev",
    totalTips: "5.7 SOL",
    supporters: 15,
  },
];

const FAQS = [
  {
    q: "WHAT IS TIPCHAIN?",
    a: "A decentralized creator tipping platform built on Solana. Fans send tips directly to creators via crypto wallets — no middlemen, no platform fees.",
  },
  {
    q: "HOW DO I RECEIVE TIPS?",
    a: "Connect your Solana wallet, create your profile, and share your link. Supporters send SOL or USDC directly to your wallet instantly.",
  },
  {
    q: "WHAT WALLETS ARE SUPPORTED?",
    a: "Phantom, Solflare, and Backpack. Any Solana browser extension wallet works.",
  },
  {
    q: "ARE THERE ANY FEES?",
    a: "ZERO platform fees. Only the Solana network tx fee (typically less than $0.01). 100% goes to creators.",
  },
  {
    q: "CAN I SEND TIPS IN USDC?",
    a: "Yes. Both SOL and USDC tips are supported. All transactions are on-chain and verifiable.",
  },
  {
    q: "HOW DO I WITHDRAW?",
    a: "Tips are sent directly to your connected wallet. Full custody, no withdrawal needed.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  HERO
// ═══════════════════════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="relative min-h-[90dvh] border-b border-[#D4D4D0]">
      {/* Green stripe top */}
      <div
        className="h-[3px]"
        style={{
          background: "repeating-linear-gradient(90deg, #059669 0px, #059669 10px, transparent 10px, transparent 20px)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="relative">
          {/* Crosshair markers */}
          <span className="absolute -left-1 -top-1 text-[#D4D4D0] text-[10px] font-bold select-none">+</span>
          <span className="absolute -right-1 -top-1 text-[#D4D4D0] text-[10px] font-bold select-none">+</span>

          <div className="brutal-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* LEFT — Content */}
            <div className="p-8 lg:p-12" style={{ background: "#FFFFFF" }}>
              <samp className="ascii-bracket text-xs tracking-[0.15em] mb-6 text-[#888888] block">
                BUILT ON SOLANA
              </samp>

              <h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[-0.04em] leading-[0.85] text-[#111111] uppercase"
                style={{ fontFamily: "Inter, IBM Plex Mono, sans-serif" }}
              >
                SUPPORT
                <br />
                CREATORS
                <br />
                <span className="text-[#059669]">DIRECTLY</span>
              </h1>

              <p className="mt-8 max-w-md text-xs sm:text-sm leading-relaxed text-[#888888] tracking-[0.02em]">
                NO MIDDLEMEN. NO PLATFORM FEES. EVERY TIP GOES STRAIGHT TO THE
                CREATORS YOU LOVE — VERIFIED ON SOLANA IN SECONDS.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/profile"
                  className="inline-flex items-center justify-center h-10 px-6 border border-[#059669] bg-[#059669] text-white text-xs font-bold tracking-[0.1em] hover:bg-[#047857] transition-colors"
                >
                  START RECEIVING &gt;&gt;
                </a>
                <a
                  href="/creators"
                  className="inline-flex items-center justify-center h-10 px-6 border border-[#D4D4D0] text-[#111111] text-xs font-bold tracking-[0.1em] hover:bg-[#F0F0EC] transition-colors"
                >
                  [ EXPLORE CREATORS ]
                </a>
              </div>

              {/* Trust indicators */}
              <div className="mt-16 flex items-center gap-8 border-t border-[#D4D4D0] pt-6">
                {([
                  { label: "TX COUNT" as const, value: "10K+" as const },
                  { label: "CREATORS" as const, value: "200+" as const },
                  { label: "SOL TIPPED" as const, value: "26.5K" as const },
                ]).map((stat) => (
                  <div key={stat.label}>
                    <data value={stat.value} className="text-xl font-bold text-[#111111] tracking-tight">
                      {stat.value}
                    </data>
                    <p className="text-[10px] tracking-[0.12em] text-[#9CA3AF]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — System Visual */}
            <div className="p-8 lg:p-12 flex flex-col justify-center" style={{ background: "#FFFFFF" }}>
              <div className="ascii-frame mb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#D4D4D0] pb-3">
                    <samp className="text-xs tracking-[0.1em] text-[#888888]">SYSTEM STATUS</samp>
                    <span className="text-[10px] text-[#059669] tracking-[0.15em] font-bold">
                      [ ACTIVE ]
                    </span>
                  </div>
                  <div className="space-y-2">
                    {([
                      { label: "NETWORK" as const, value: "SOLANA DEVNET" as const },
                      { label: "CLUSTER NODES" as const, value: "1,847" as const },
                      { label: "TPS" as const, value: "4,213" as const },
                      { label: "FINALITY" as const, value: "0.42s" as const },
                    ]).map((row) => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-[10px] tracking-[0.1em] text-[#9CA3AF]">
                          {row.label}
                          <span className="text-[#D4D4D0] mx-1">::</span>
                        </span>
                        <data value={row.value} className="text-[11px] text-[#111111] tracking-[0.05em] font-medium">
                          {row.value}
                        </data>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live ticker */}
              <div className="border border-[#D4D4D0] px-4 py-3 bg-[#F9F9F7]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block size-2 bg-[#059669]" />
                    <span className="text-[10px] tracking-[0.1em] text-[#888888]">LIVE</span>
                  </div>
                  <span className="text-[10px] text-[#9CA3AF] tracking-[0.05em] truncate">
                    TX &gt; 0x7a3f...b92e &gt; +0.5 SOL &gt; CONFIRMED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  STATS
// ═══════════════════════════════════════════════════════════════════════════

function StatsGrid() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <div
        className="h-[2px]"
        style={{
          background: "repeating-linear-gradient(90deg, #059669 0px, #059669 6px, transparent 6px, transparent 12px)",
        }}
      />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="brutal-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {([
            { label: "TOTAL TIPPED" as const, value: "26.5 SOL" as const },
            { label: "CREATORS" as const, value: "3" as const },
            { label: "TX COUNT" as const, value: "107" as const },
          ]).map((stat) => (
            <div key={stat.label} className="p-8 text-center" style={{ background: "#FFFFFF" }}>
              <data value={stat.value} className="text-3xl font-bold text-[#111111]">
                {stat.value}
              </data>
              <p className="text-[10px] tracking-[0.12em] text-[#9CA3AF] mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  FEATURED CREATORS
// ═══════════════════════════════════════════════════════════════════════════

function FeaturedSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          FEATURED UNITS
        </samp>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[#111111] mb-4 uppercase">
          CREATORS ON TIPCHAIN
        </h2>
        <p className="max-w-md text-xs tracking-[0.05em] text-[#9CA3AF] mb-16">
          DISCOVER AND SUPPORT AMAZING CREATORS BUILDING ON SOLANA
        </p>

        <div className="brutal-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {FEATURED_CREATORS.map((creator) => {
            const initials = creator.displayName.split(" ").map((n) => n[0]).join("").toUpperCase();
            return (
              <a
                key={creator.username}
                href={`/creator/${creator.username}`}
                className="group block p-6 hover:bg-[#F9F9F7] transition-colors"
                style={{ background: "#FFFFFF" }}
              >
                <div className="flex items-center gap-4 border-b border-[#D4D4D0] pb-4 mb-4">
                  <div className="flex size-12 items-center justify-center border border-[#D4D4D0] bg-[#F9F9F7] text-xs font-bold text-[#059669]">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#111111] tracking-[-0.02em]">
                        {creator.displayName}
                      </span>
                      <span className="inline-block size-1.5 bg-[#059669]" />
                    </div>
                    <p className="text-[10px] tracking-[0.08em] text-[#9CA3AF]">@{creator.username}</p>
                  </div>
                </div>
                <p className="text-xs text-[#888888] mb-6 leading-relaxed">{creator.bio}</p>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs font-bold text-[#111111]">{creator.totalTips}</p>
                    <p className="text-[9px] tracking-[0.1em] text-[#9CA3AF]">EARNED</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#111111]">{creator.supporters}</p>
                    <p className="text-[9px] tracking-[0.1em] text-[#9CA3AF]">SUPPORTERS</p>
                  </div>
                  <div className="ml-auto text-[#D4D4D0] group-hover:text-[#059669] transition-colors">
                    <ArrowRight className="size-4" weight="bold" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/creators"
            className="inline-flex items-center justify-center h-10 px-8 border border-[#D4D4D0] text-[#111111] text-xs font-bold tracking-[0.1em] hover:bg-[#F0F0EC] transition-colors"
          >
            [ VIEW ALL CREATORS ] &gt;&gt;
          </a>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  WHY TIPCHAIN
// ═══════════════════════════════════════════════════════════════════════════

const BENEFITS = [
  {
    title: "INSTANT TX",
    description: "Tips arrive in seconds on Solana. No waiting, no delays.",
  },
  {
    title: "ZERO FEES",
    description: "Every lamport goes directly to creators. Zero platform cuts.",
  },
  {
    title: "ON-CHAIN",
    description: "Every tip recorded on Solana. Verifiable and immutable.",
  },
  {
    title: "DIRECT CONNECTION",
    description: "Wallet-to-wallet. No middlemen, real relationships.",
  },
];

function BenefitsSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <div
        className="h-[2px]"
        style={{
          background: "repeating-linear-gradient(90deg, #059669 0px, #059669 6px, transparent 6px, transparent 12px)",
        }}
      />
      <div className="mx-auto max-w-7xl px-6 py-24">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          ADVANTAGES
        </samp>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[#111111] mb-16 uppercase">
          BUILT FOR CREATORS
        </h2>

        <div className="brutal-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="p-8" style={{ background: "#FFFFFF" }}>
              <div className="flex items-center justify-center size-10 border border-[#D4D4D0] bg-[#F9F9F7] mb-6">
                <span className="text-[#059669] text-sm font-bold">//</span>
              </div>
              <h3 className="text-sm font-bold text-[#111111] tracking-[-0.02em] mb-3 uppercase">
                {benefit.title}
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  HOW IT WORKS
// ═══════════════════════════════════════════════════════════════════════════

function HowItWorksSection() {
  const steps = [
    { step: "01", label: "CONNECT WALLET", desc: "Connect Phantom, Solflare, or Backpack to get started." },
    { step: "02", label: "FIND CREATORS", desc: "Browse profiles and discover creators you want to support." },
    { step: "03", label: "SEND TIPS", desc: "Send SOL or USDC directly — confirmed in seconds, zero fees." },
  ];

  return (
    <section className="border-b border-[#D4D4D0]">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          OPERATIONS MANUAL
        </samp>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[#111111] mb-16 uppercase">
          HOW IT WORKS
        </h2>

        <div className="brutal-grid relative" style={{ gridTemplateColumns: "1fr" }}>
          <span className="absolute -left-1 -top-1 text-[#D4D4D0] text-[10px] font-bold select-none">+</span>
          {steps.map((item) => (
            <div
              key={item.step}
              className="p-8 lg:p-10 flex items-start gap-6"
              style={{ background: "#FFFFFF" }}
            >
              <span className="text-3xl font-bold text-[#059669] tracking-[-0.04em] leading-none shrink-0">
                {item.step}
              </span>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#111111] tracking-[-0.02em] mb-2 uppercase">
                  {item.label}
                </h3>
                <p className="text-xs text-[#888888] leading-relaxed max-w-md">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <dl className="mt-8 border border-[#059669] bg-[#F0FDF4] p-4">
          <div className="flex items-center gap-3">
            <span className="inline-block size-2 bg-[#059669]" />
            <dt className="text-[10px] tracking-[0.1em] text-[#059669] font-medium sr-only">System Status</dt>
            <dd className="text-[10px] tracking-[0.1em] text-[#059669] font-semibold">
              SYSTEM READY /// {steps.length} OPERATIONAL UNITS STANDBY
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  FAQ
// ═══════════════════════════════════════════════════════════════════════════

function FAQSection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <div
        className="h-[2px]"
        style={{
          background: "repeating-linear-gradient(90deg, #059669 0px, #059669 6px, transparent 6px, transparent 12px)",
        }}
      />
      <div className="mx-auto max-w-4xl px-6 py-24">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-2 text-[#888888] block">
          KNOWLEDGE BASE
        </samp>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[#111111] mb-12 uppercase">
          FREQUENTLY ASKED QUESTIONS
        </h2>

        <div className="border border-[#D4D4D0] divide-y divide-[#D4D4D0]">
          {FAQS.map((faq, i) => (
            <details key={i} className="group">
              <summary className="flex items-center justify-between px-6 py-5 cursor-pointer select-none text-xs font-bold tracking-[0.02em] text-[#111111] hover:bg-[#F9F9F7] transition-colors list-none">
                <span className="pr-4">{faq.q}</span>
                <span className="text-[#059669] text-[10px] group-open:rotate-180 transition-transform">
                  [ + ]
                </span>
              </summary>
              <div className="px-6 pb-5">
                <p className="text-xs text-[#888888] leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  CTA
// ═══════════════════════════════════════════════════════════════════════════

function CTASection() {
  return (
    <section className="border-b border-[#D4D4D0]">
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <samp className="ascii-bracket text-xs tracking-[0.15em] mb-4 text-[#888888] block">
          DEPLOY COMMAND
        </samp>
        <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.04em] text-[#111111] mb-6 uppercase">
          READY TO START?
        </h2>
        <p className="text-xs tracking-[0.05em] text-[#9CA3AF] mb-10 max-w-lg mx-auto">
          JOIN THE CREATOR ECONOMY ON SOLANA. CONNECT YOUR WALLET AND START RECEIVING TIPS IN MINUTES.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="/profile"
            className="inline-flex items-center justify-center h-12 px-8 border-2 border-[#059669] bg-[#059669] text-white text-xs font-bold tracking-[0.1em] hover:bg-[#047857] transition-colors"
          >
            START RECEIVING &gt;&gt;
          </a>
          <a
            href="/creators"
            className="inline-flex items-center justify-center h-12 px-8 border-2 border-[#D4D4D0] text-[#111111] text-xs font-bold tracking-[0.1em] hover:bg-[#F0F0EC] transition-colors"
          >
            [ EXPLORE CREATORS ]
          </a>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  FOOTER
// ═══════════════════════════════════════════════════════════════════════════

const WHITEPAPER_URL =
  "https://docs.google.com/document/d/1Q1NoKZlZSb_xE7pHY9kbPaliufmySOONzFl1cVZ95iI/edit?usp=sharing";

function Footer() {
  return (
    <footer className="border-t border-[#D4D4D0]">
      <div
        className="h-[3px]"
        style={{
          background: "repeating-linear-gradient(90deg, #059669 0px, #059669 8px, transparent 8px, transparent 16px)",
        }}
      />
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Resources grid */}
        <div className="brutal-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {/* Whitepaper */}
          <div className="p-6" style={{ background: "#FFFFFF" }}>
            <p className="text-[10px] tracking-[0.12em] text-[#059669] font-bold mb-3 uppercase">
              [ WHITEPAPER ]
            </p>
            <p className="text-[10px] text-[#888888] leading-relaxed mb-4">
              Read the official TipChain whitepaper — technical overview, tokenomics, and architecture.
            </p>
            <a
              href={WHITEPAPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#059669] font-bold tracking-[0.05em] hover:text-[#047857] transition-colors uppercase"
            >
              READ &gt;&gt;
            </a>
          </div>

          {/* SDK */}
          <div className="p-6" style={{ background: "#FFFFFF" }}>
            <p className="text-[10px] tracking-[0.12em] text-[#059669] font-bold mb-3 uppercase">
              [ SDK ]
            </p>
            <p className="text-[10px] text-[#888888] leading-relaxed mb-4">
              @tipchain/sdk — Universal JavaScript SDK for integrating TipChain into your app.
            </p>
            <a
              href="/docs/sdk"
              className="inline-flex items-center gap-1 text-[10px] text-[#059669] font-bold tracking-[0.05em] hover:text-[#047857] transition-colors uppercase"
            >
              DOCS &gt;&gt;
            </a>
          </div>

          {/* API */}
          <div className="p-6" style={{ background: "#FFFFFF" }}>
            <p className="text-[10px] tracking-[0.12em] text-[#059669] font-bold mb-3 uppercase">
              [ API ]
            </p>
            <p className="text-[10px] text-[#888888] leading-relaxed mb-4">
              @tipchain/api — Type-safe REST client for the TipChain platform API.
            </p>
            <a
              href="/docs/api"
              className="inline-flex items-center gap-1 text-[10px] text-[#059669] font-bold tracking-[0.05em] hover:text-[#047857] transition-colors uppercase"
            >
              REFERENCE &gt;&gt;
            </a>
          </div>

          {/* Source */}
          <div className="p-6" style={{ background: "#FFFFFF" }}>
            <p className="text-[10px] tracking-[0.12em] text-[#059669] font-bold mb-3 uppercase">
              [ SOURCE ]
            </p>
            <p className="text-[10px] text-[#888888] leading-relaxed mb-4">
              Open-source monorepo. Contribute, file issues, or self-host your own instance.
            </p>
            <a
              href="https://github.com/shivamprajapati17/tipchain12"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#059669] font-bold tracking-[0.05em] hover:text-[#047857] transition-colors uppercase"
            >
              GITHUB &gt;&gt;
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#059669] tracking-[0.15em] font-bold">[ T ]</span>
            <span className="text-[10px] text-[#9CA3AF] tracking-[0.05em]">
              TIPCHAIN // SUPPORT CREATORS DIRECTLY
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] text-[#D4D4D0] tracking-[0.1em] uppercase">
              REV 2.6
            </span>
            <span className="text-[9px] text-[#D4D4D0] tracking-[0.1em] uppercase">
              POWERED BY SOLANA
            </span>
            <span className="text-[9px] text-[#D4D4D0]" style={{ fontFamily: "serif" }}>
              ®
            </span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#E8E8E4]">
          <p className="text-[8px] text-[#D4D4D0] tracking-[0.15em] text-center uppercase">
            &lt; DECLASSIFIED // DISTRIBUTION UNLIMITED &gt;
          </p>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />
      <StatsGrid />
      <FeaturedSection />
      <BenefitsSection />
      <HowItWorksSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
