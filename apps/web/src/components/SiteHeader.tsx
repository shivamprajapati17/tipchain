"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Compass, Layers, Menu, X, Sparkles } from "lucide-react";
import { WalletButton } from "@/components/WalletButton";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/quests", label: "Quests" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/creators", label: "Creators" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/points", label: "Points", icon: Sparkles },
  { href: "/vaults", label: "Vaults" },
  { href: "/referrals", label: "Referrals" },
  { href: "/history", label: "History" },
  { href: "/dashboard", label: "Dashboard", icon: Layers, highlight: true },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex justify-center">
      <nav
        className="mx-4 mt-3 glass-card rounded-2xl"
        style={{ maxWidth: "min(94vw, 1040px)", minWidth: "320px" }}
      >
        <div className="flex h-12 items-center justify-between px-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0 group">
            <motion.span
              whileHover={{ rotate: -8, scale: 1.05 }}
              className="flex items-center justify-center size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold group-hover:bg-emerald-500/20 transition-colors"
            >
              T
            </motion.span>
            <span className="text-sm font-semibold text-white tracking-tight hidden sm:inline" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              TipChain
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    active
                      ? link.highlight
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-white bg-white/10"
                      : link.highlight
                        ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {Icon && <Icon className="size-3.5" />}
                  {link.label}
                  {active && !link.highlight && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent"
                    />
                  )}
                </a>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <WalletButton />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className="lg:hidden flex items-center justify-center size-8 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile menu sheet */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            data-testid="mobile-menu"
            className="lg:hidden fixed inset-x-4 top-[4.5rem] z-50"
            style={{ maxWidth: "min(94vw, 1040px)", margin: "0 auto" }}
          >
            <div className="glass-card rounded-2xl p-3 shadow-premium-lg">
              <div className="grid grid-cols-2 gap-1">
                {NAV_LINKS.map((link, i) => {
                  const Icon = link.icon ?? Compass;
                  const active = isActive(link.href);
                  return (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                        active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      {link.label}
                    </motion.a>
                  );
                })}
              </div>
              <div className="mt-2 border-t border-white/5 pt-2 flex items-center gap-2 px-1">
                <span className="pulse-dot" />
                <span className="text-[10px] text-white/30">
                  Solana Devnet — Operational
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
