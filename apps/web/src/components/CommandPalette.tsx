"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CornerDownLeft, Compass } from "lucide-react";
import { getCreators, type CreatorResponse } from "@/lib/api";
import { NAV_LINKS } from "@/components/navLinks";

// ─── Helpers ────────────────────────────────────────────────────────────────

function creatorHref(username: string) {
  return `/creator/${encodeURIComponent(username)}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [creators, setCreators] = useState<CreatorResponse[]>([]);
  const [creatorsLoaded, setCreatorsLoaded] = useState(false);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Cmd/Ctrl + K.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Load creators once, the first time the palette opens.
  useEffect(() => {
    if (!open || creatorsLoaded) return;
    setLoadingCreators(true);
    getCreators()
      .then((data) => {
        setCreators(data.creators);
        setCreatorsLoaded(true);
      })
      .catch(() => {
        // Palette stays fully functional for page navigation without creators.
      })
      .finally(() => setLoadingCreators(false));
  }, [open, creatorsLoaded]);

  // Focus the input when the palette opens.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_LINKS;
    return NAV_LINKS.filter(
      (link) =>
        link.label.toLowerCase().includes(q) || link.href.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredCreators = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return creators.slice(0, 5);
    return creators
      .filter(
        (c) =>
          c.username.toLowerCase().includes(q) ||
          (c.displayName ?? "").toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, creators]);

  const totalResults = filteredPages.length + filteredCreators.length;

  // Reset index whenever results change.
  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  const navigateTo = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, totalResults - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex < 0 || activeIndex >= totalResults) return;
      if (activeIndex < filteredPages.length) {
        navigateTo(filteredPages[activeIndex].href);
      } else {
        const creator = filteredCreators[activeIndex - filteredPages.length];
        if (creator) navigateTo(creatorHref(creator.username));
      }
    }
  }

  return (
    <>
      {/* Header search affordance */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="hidden xl:flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
      >
        <Search className="size-3" />
        <span className="hidden md:inline">Search</span>
        <kbd className="rounded border border-white/10 bg-white/5 px-1 py-px font-mono text-[9px]">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="xl:hidden flex items-center justify-center size-8 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
      >
        <Search className="size-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[12vh]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="w-full max-w-xl overflow-hidden rounded-2xl glass-card shadow-premium-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input row */}
              <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3.5">
                <Search className="size-4 shrink-0 text-white/40" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search pages and creators..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                />
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[46vh] overflow-y-auto p-2" onMouseDown={(e) => e.preventDefault()}>
                {totalResults === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm text-white/50">
                      No results for &ldquo;{query}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      Try a page name or a creator username.
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredPages.length > 0 && (
                      <div>
                        <div className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-widest text-white/30">
                          Pages
                        </div>
                        {filteredPages.map((link, i) => {
                          const Icon = link.icon ?? Compass;
                          const active = i === activeIndex;
                          return (
                            <button
                              key={link.href}
                              onClick={() => navigateTo(link.href)}
                              onMouseEnter={() => setActiveIndex(i)}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                              }`}
                            >
                              <span
                                className={`flex size-7 items-center justify-center rounded-lg ${
                                  link.highlight
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-white/5 text-white/50"
                                }`}
                              >
                                <Icon className="size-3.5" />
                              </span>
                              <span className="flex-1">{link.label}</span>
                              {link.highlight && (
                                <span className="text-[10px] text-emerald-400">Highlight</span>
                              )}
                              {active && (
                                <CornerDownLeft className="size-3 shrink-0 text-white/30" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {filteredCreators.length > 0 && (
                      <div className="mt-1 border-t border-white/5 pt-1">
                        <div className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-widest text-white/30">
                          {loadingCreators ? "Loading creators..." : "Creators"}
                        </div>
                        {filteredCreators.map((creator, j) => {
                          const i = filteredPages.length + j;
                          const active = i === activeIndex;
                          return (
                            <button
                              key={creator.walletAddress}
                              onClick={() => navigateTo(creatorHref(creator.username))}
                              onMouseEnter={() => setActiveIndex(i)}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                              }`}
                            >
                              <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500/25 to-cyan-500/25 text-[10px] font-bold text-emerald-300">
                                {creator.avatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={creator.avatarUrl}
                                    alt=""
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  creator.username.slice(0, 1).toUpperCase()
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">
                                  {creator.displayName || creator.username}
                                </span>
                                <span className="block truncate text-[10px] text-white/40">
                                  @{creator.username}
                                </span>
                              </span>
                              {active && <CornerDownLeft className="size-3 shrink-0 text-white/30" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
