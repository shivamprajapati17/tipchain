import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { WalletButton } from "@/components/WalletButton";
import { Bot, Compass, Layers, Menu } from "lucide-react";

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

export const metadata: Metadata = {
  title: "TipChain — AI-Native GameFi & DeFi Infrastructure on Solana",
  description:
    "The AI-native GameFi + DeFi infrastructure platform on Solana. AI agents, quests, rewards, NFT utilities, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          <header className="fixed top-0 right-0 left-0 z-50 flex justify-center">
            <nav
              className="mx-4 mt-3 glass-card rounded-2xl"
              style={{ maxWidth: "min(90vw, 800px)", minWidth: "320px" }}
            >
              <div className="flex h-11 items-center justify-between px-4">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2.5 shrink-0 group">
                  <span className="flex items-center justify-center size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold group-hover:bg-emerald-500/20 transition-colors">
                    T
                  </span>
                  <span className="text-sm font-semibold text-white tracking-tight hidden sm:inline" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    TipChain
                  </span>
                </a>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                  <a href="/" className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    Home
                  </a>
                  <a href="/ai" className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-1.5">
                    <Bot className="size-3.5" /> AI
                  </a>
                  <a href="/quests" className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    Quests
                  </a>
                  <a href="/marketplace" className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    Marketplace
                  </a>
                  <a href="/creators" className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    Creators
                  </a>
                  <a href="/leaderboard" className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    Leaderboard
                  </a>
                  <a href="/dashboard" className="px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all flex items-center gap-1.5">
                    <Layers className="size-3.5" /> Dashboard
                  </a>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                  <WalletButton />
                  {/* Mobile menu toggle */}
                  <button className="md:hidden flex items-center justify-center size-8 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all">
                    <Menu className="size-4" />
                  </button>
                </div>
              </div>
            </nav>
          </header>

          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
