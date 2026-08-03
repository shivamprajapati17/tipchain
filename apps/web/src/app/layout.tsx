import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "TipChain — Tip. Earn. Belong. On Solana.",
  description:
    "The human-first creator economy on Solana. Tip creators, earn TipPoints, back vaults, and grow together — every action verifiable on-chain.",
};

function GlobalFooter() {
  return (
    <footer className="relative border-t border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06060a] to-[#030308] pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex items-center justify-center size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                T
              </span>
              <span className="text-sm font-semibold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                TipChain
              </span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed max-w-xs">
              Tip the creators you love. Earn TipPoints that prove your support. Built on Solana, powered by people.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Earn</h4>
              <div className="space-y-2.5">
                <a href="/creators" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">Creators</a>
                <a href="/leaderboard" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">Leaderboard</a>
                <a href="/points" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">TipPoints</a>
                <a href="/quests" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">Quests</a>
                <a href="/tokenomics" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">Tokenomics</a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Give</h4>
              <div className="space-y-2.5">
                <a href="/vaults" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">Vaults</a>
                <a href="/referrals" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">Referrals</a>
                <a href="/history" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">History</a>
                <a href="/dashboard" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">Dashboard</a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Build</h4>
              <div className="space-y-2.5">
                <a href="/ai" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">AI Agents</a>
                <a href="/defi" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">DeFi Hub</a>
                <a href="/marketplace" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">Marketplace</a>
                <a href="https://github.com/shivamprajapati17/tipchain12" target="_blank" rel="noopener noreferrer" className="block text-xs text-white/30 hover:text-emerald-400 transition-colors">GitHub</a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Network</h4>
              <div className="space-y-2.5 text-xs text-white/30">
                <div className="flex items-center gap-2">
                  <span className="pulse-dot" /> Solana Devnet
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-cyan-400/50" /> Helius RPC
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-400/50" /> Operational
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 hairline flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[10px] text-white/20">© 2026 TipChain. Built on Solana.</span>
          <span className="text-[10px] text-white/20">
            v3.0 — human-first creator economy
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground overflow-x-hidden">
        <div className="grain" aria-hidden />
        <Providers>
          <SiteHeader />
          <main className="flex-1 flex flex-col pt-16">{children}</main>
          <GlobalFooter />
        </Providers>
      </body>
    </html>
  );
}
