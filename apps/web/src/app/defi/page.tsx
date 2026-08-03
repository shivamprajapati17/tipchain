"use client";

import {
  ArrowLeftRight,
  ArrowDownUp,
  ChevronDown,
  Droplets,
  Globe,
  Landmark,
  Lock,
  Loader2,
  Search,
  Sprout,
  Gem,
  Wallet,
  Zap,
  X,
  Check,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toAddress, type TransactionInstructionInput } from "@solana/client";
import { AccountRole } from "@solana/instructions";
import type { Lamports } from "@solana/kit";
import {
  useWalletConnection,
  useWalletSession,
  useSendTransaction,
  useBalance,
  useWalletActions,
} from "@solana/react-hooks";
import {
  getSwapQuote,
  getSwapInstructions,
  searchSwapTokens,
  getStaking,
  getLending,
  getLiquidityPools,
  getYieldFarming,
  getTreasury,
  getCrossChainBridge,
  type SwapQuote as SwapQuoteType,
  type SwapToken,
} from "@/lib/api";

// ─── Constants ──────────────────────────────────────────────────────────────

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const DEFAULT_TOKENS: SwapToken[] = [
  { address: SOL_MINT, symbol: "SOL", name: "Solana", decimals: 9, isKnown: true },
  { address: USDC_MINT, symbol: "USDC", name: "USD Coin", decimals: 6, isKnown: true },
  { address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT", name: "Tether USD", decimals: 6 },
  { address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", symbol: "BONK", name: "Bonk", decimals: 5 },
  { address: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", symbol: "mSOL", name: "Marinade Staked SOL", decimals: 9 },
  { address: "J1toso1uCk3QLmjYXoTpK9sYgdG6E4Vbh15WyoP29M6", symbol: "JitoSOL", name: "Jito Staked SOL", decimals: 9 },
];

const QUICK_PAIRS: Array<[string, string]> = [
  [SOL_MINT, USDC_MINT],
  [USDC_MINT, SOL_MINT],
  [SOL_MINT, "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"],
  [SOL_MINT, "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"],
];

const TABS = [
  { id: "swap", label: "Swap", icon: ArrowLeftRight },
  { id: "pools", label: "Pools", icon: Droplets },
  { id: "stake", label: "Stake", icon: Lock },
  { id: "lend", label: "Lend", icon: Landmark },
  { id: "yield", label: "Yield", icon: Sprout },
  { id: "treasury", label: "Treasury", icon: Gem },
  { id: "bridge", label: "Bridge", icon: Globe },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Decode a Jupiter base64 (legacy serialized JSON) instruction into a kit IInstruction. */
function decodeJupiterInstruction(b64: string): TransactionInstructionInput {
  const parsed = JSON.parse(atob(b64)) as {
    programId: string;
    keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
    data: string;
  };
  return {
    programAddress: toAddress(parsed.programId),
    data: base64ToBytes(parsed.data),
    accounts: parsed.keys.map((k) => ({
      address: toAddress(k.pubkey),
      role: k.isSigner
        ? (k.isWritable ? AccountRole.WRITABLE_SIGNER : AccountRole.READONLY_SIGNER)
        : (k.isWritable ? AccountRole.WRITABLE : AccountRole.READONLY),
    })),
  };
}

function formatTokenAmount(raw: string, decimals: number): string {
  const value = Number(raw) / Math.pow(10, decimals);
  if (value === 0) return "0";
  if (value < 0.0001) return value.toExponential(3);
  return value.toLocaleString(undefined, { maximumSignificantDigits: 6 });
}

function TokenAvatar({ token, size = "size-8" }: { token: SwapToken | null; size?: string }) {
  if (!token) return <span className={`${size} rounded-full bg-white/5`} />;
  return (
    <span className={`${size} flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500/25 to-cyan-500/25 text-[10px] font-bold text-emerald-300 shrink-0`}>
      {token.logoURI ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={token.logoURI} alt={token.symbol} className="size-full object-cover" />
      ) : (
        token.symbol.slice(0, 1)
      )}
    </span>
  );
}

// ─── Swap Widget ────────────────────────────────────────────────────────────

function SwapWidget() {
  const { connected } = useWalletConnection();
  const session = useWalletSession();
  const { send, isSending, signature, error: sendError, reset } = useSendTransaction();
  const { requestAirdrop } = useWalletActions();
  const balance = useBalance(session?.account.address);

  const [inputToken, setInputToken] = useState<SwapToken>(DEFAULT_TOKENS[0]);
  const [outputToken, setOutputToken] = useState<SwapToken>(DEFAULT_TOKENS[1]);
  const [inputAmount, setInputAmount] = useState("1");
  const [slippage, setSlippage] = useState(50);
  const [quote, setQuote] = useState<SwapQuoteType | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [picking, setPicking] = useState<"in" | "out" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SwapToken[]>([]);
  const [sentSig, setSentSig] = useState<string | null>(null);
  const [airdropping, setAirdropping] = useState(false);
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const solBalance = Number(balance.lamports ?? 0) / 1e9;

  // Debounced quote fetch
  useEffect(() => {
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    if (!inputAmount || Number(inputAmount) <= 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    const rawAmount = BigInt(Math.floor(Number(inputAmount) * 10 ** inputToken.decimals));
    if (rawAmount <= BigInt(0)) return;
    setQuoting(true);
    quoteTimer.current = setTimeout(async () => {
      try {
        const data = await getSwapQuote(inputToken.address, outputToken.address, rawAmount.toString(), slippage);
        setQuote(data.quote);
        setQuoteError(null);
      } catch (err) {
        setQuote(null);
        setQuoteError(err instanceof Error ? err.message : "Failed to fetch quote");
      } finally {
        setQuoting(false);
      }
    }, 350);
    return () => {
      if (quoteTimer.current) clearTimeout(quoteTimer.current);
    };
  }, [inputAmount, inputToken, outputToken, slippage]);

  const openPicker = async (side: "in" | "out") => {
    setPicking(side);
    setSearchQuery("");
    try {
      const data = await searchSwapTokens("SOL");
      setSearchResults(data.tokens.slice(0, 12));
    } catch {
      setSearchResults([]);
    }
  };

  const onSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) return;
    try {
      const data = await searchSwapTokens(q);
      setSearchResults(data.tokens.slice(0, 12));
    } catch {
      setSearchResults([]);
    }
  };

  const selectToken = (token: SwapToken) => {
    if (!picking) return;
    if (picking === "in") {
      if (token.address === outputToken.address) {
        setOutputToken(inputToken);
      }
      setInputToken(token);
    } else {
      if (token.address === inputToken.address) {
        setInputToken(outputToken);
      }
      setOutputToken(token);
    }
    setPicking(null);
  };

  const swapSides = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
  };

  const executeSwap = async () => {
    if (!session || !quote) return;
    setSentSig(null);
    reset();
    try {
      const instructionsData = await getSwapInstructions(quote, session.account.address);
      const instructionB64 = [
        instructionsData.tokenLedgerInstruction,
        ...instructionsData.computeBudgetInstructions,
        ...instructionsData.setupInstructions,
        instructionsData.swapInstruction,
        instructionsData.cleanupInstruction,
      ].filter((i): i is string => !!i);
      const instructions = instructionB64.map(decodeJupiterInstruction);
      const sig = await send({
        instructions,
        feePayer: session.account.address,
        version: 0,
      });
      setSentSig(sig);
    } catch (err) {
      // sendError is surfaced via the error banner below
    }
  };

  const handleAirdrop = async () => {
    if (!session) return;
    setAirdropping(true);
    try {
      await requestAirdrop(session.account.address, BigInt(1_000_000_000) as Lamports);
    } catch {
      // devnet faucets are rate limited; non-fatal
    } finally {
      setAirdropping(false);
    }
  };

  const pickerList = searchQuery.trim() ? searchResults : DEFAULT_TOKENS;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 shadow-premium backdrop-blur-sm">
        {/* Balance row */}
        <div className="flex items-center justify-between px-1 pb-3">
          <span className="text-[10px] uppercase tracking-widest text-white/30">Jupiter swap</span>
          {connected && session ? (
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
              <Wallet className="size-3" />
              {solBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL
            </span>
          ) : null}
        </div>

        {/* From */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-white/30">You pay</span>
            {connected && inputToken.address === SOL_MINT && (
              <button
                onClick={() => setInputAmount(solBalance.toFixed(6))}
                className="text-[10px] font-semibold text-emerald-400/80 hover:text-emerald-300"
              >
                MAX
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0.0"
              className="w-full bg-transparent text-2xl font-semibold text-white outline-none placeholder:text-white/20"
            />
            <button
              onClick={() => openPicker("in")}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <TokenAvatar token={inputToken} size="size-6" />
              {inputToken.symbol}
              <ChevronDown className="size-3.5 text-white/40" />
            </button>
          </div>
        </div>

        {/* Swap direction */}
        <div className="relative z-10 -my-2.5 flex justify-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={swapSides}
            aria-label="Swap direction"
            className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-[#0c0c12] text-emerald-400 transition-colors hover:border-emerald-500/30 hover:bg-[#12121a]"
          >
            <ArrowDownUp className="size-4" />
          </motion.button>
        </div>

        {/* To */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-white/30">You receive</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1">
              {quote && !quoting ? (
                <div className="text-2xl font-semibold text-white">
                  {formatTokenAmount(quote.outAmount, outputToken.decimals)}
                  <span className="ml-2 text-xs font-normal text-white/40">
                    {outputToken.symbol}
                  </span>
                </div>
              ) : (
                <div className="text-2xl font-semibold text-white/20">0.0</div>
              )}
            </div>
            <button
              onClick={() => openPicker("out")}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <TokenAvatar token={outputToken} size="size-6" />
              {outputToken.symbol}
              <ChevronDown className="size-3.5 text-white/40" />
            </button>
          </div>
        </div>

        {/* Quote details */}
        <div className="mt-4 space-y-1.5 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-[11px] text-white/45">
          {quoting ? (
            <div className="flex items-center gap-2 text-white/40">
              <Loader2 className="size-3 animate-spin" /> Fetching best route...
            </div>
          ) : quote ? (
            <>
              <div className="flex justify-between">
                <span>Rate</span>
                <span className="font-mono text-white/70">
                  1 {inputToken.symbol} = {formatTokenAmount(quote.outAmount, outputToken.decimals)} {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Price impact</span>
                <span className={`font-mono ${Number(quote.priceImpactPct) > 3 ? "text-amber-400" : "text-white/70"}`}>
                  {Number(quote.priceImpactPct).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Route</span>
                <span className="font-mono text-white/70">
                  {quote.routePlan?.length ?? 1} hop{quote.routePlan?.length > 1 ? "s" : ""} via Jupiter
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min received (slippage {slippage / 100}%)</span>
                <span className="font-mono text-white/70">
                  {formatTokenAmount(quote.otherAmountThreshold, outputToken.decimals)} {outputToken.symbol}
                </span>
              </div>
            </>
          ) : quoteError ? (
            <div className="text-rose-400">{quoteError}</div>
          ) : (
            <div className="text-white/30">Enter an amount to see the best route.</div>
          )}
        </div>

        {/* Slippage selector */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/30">Slippage</span>
          {[50, 100, 300].map((bps) => (
            <button
              key={bps}
              onClick={() => setSlippage(bps)}
              className={`rounded-lg px-2 py-1 font-mono text-[10px] transition-colors ${
                slippage === bps ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/40 hover:text-white/70"
              }`}
            >
              {bps / 100}%
            </button>
          ))}
        </div>

        {/* Swap button / connect prompt */}
        <div className="mt-4">
          {!connected || !session ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-center text-xs text-white/40">
              Connect your wallet to swap on Jupiter
            </div>
          ) : isSending ? (
            <button disabled className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 px-4 py-3.5 text-sm font-semibold text-emerald-300">
              <Loader2 className="size-4 animate-spin" /> Swapping...
            </button>
          ) : (
            <button
              onClick={executeSwap}
              disabled={!quote || quoting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-[0_0_32px_rgba(16,185,129,0.35)] disabled:opacity-40 disabled:hover:shadow-none"
            >
              <Zap className="size-4" />
              {quote ? `Swap ${inputToken.symbol} for ${outputToken.symbol}` : "Enter amount"}
            </button>
          )}
          {(sendError || sentSig) && (
            <div className="mt-3 rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed">
              {sentSig ? (
                <span className="flex items-center gap-2 text-emerald-400">
                  <Check className="size-3.5" /> Swap sent —{" "}
                  <a
                    href={`https://explorer.solana.com/tx/${sentSig}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline decoration-emerald-400/40 underline-offset-2 hover:decoration-emerald-400"
                  >
                    view on explorer <ExternalLink className="size-3" />
                  </a>
                </span>
              ) : (
                <span className="text-rose-400">
                  {(sendError instanceof Error ? sendError.message : "Swap failed — this may be a devnet liquidity limitation.").slice(0, 220)}
                </span>
              )}
            </div>
          )}
          {connected && session && (
            <button
              onClick={handleAirdrop}
              disabled={airdropping}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-2.5 text-[11px] font-medium text-white/50 transition-colors hover:text-white/80"
            >
              {airdropping ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Request devnet SOL airdrop
            </button>
          )}
        </div>
      </div>

      {/* Quick pairs */}
      <div className="mt-4">
        <p className="px-1 pb-2 text-[10px] uppercase tracking-widest text-white/25">Quick pairs</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PAIRS.map(([inMint, outMint]) => {
            const from = DEFAULT_TOKENS.find((t) => t.address === inMint);
            const to = DEFAULT_TOKENS.find((t) => t.address === outMint);
            if (!from || !to) return null;
            const active = inputToken.address === inMint && outputToken.address === outMint;
            return (
              <button
                key={`${inMint}-${outMint}`}
                onClick={() => {
                  setInputToken(from);
                  setOutputToken(to);
                }}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-white/8 bg-white/[0.02] text-white/50 hover:text-white/80"
                }`}
              >
                {from.symbol}
                <ArrowDownUp className="size-2.5 opacity-50" />
                {to.symbol}
              </button>
            );
          })}
        </div>
      </div>

      {/* Token picker modal */}
      <AnimatePresence>
        {picking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[14vh]"
            onClick={() => setPicking(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl glass-card shadow-premium-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <Search className="size-4 text-white/40" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="Search token name or symbol"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
                <button onClick={() => setPicking(null)} aria-label="Close" className="text-white/40 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>
              <div className="max-h-[42vh] overflow-y-auto p-2">
                {pickerList.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-white/40">No tokens found</div>
                ) : (
                  pickerList.map((token) => {
                    const selected = picking === "in" ? token.address === inputToken.address : token.address === outputToken.address;
                    return (
                      <button
                        key={token.address}
                        onClick={() => selectToken(token)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          selected ? "bg-emerald-500/10" : "hover:bg-white/5"
                        }`}
                      >
                        <TokenAvatar token={token} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-white">{token.symbol}</span>
                          <span className="block truncate text-[11px] text-white/40">{token.name}</span>
                        </span>
                        {selected && <Check className="size-4 shrink-0 text-emerald-400" />}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Data tabs ──────────────────────────────────────────────────────────────

type Fetcher = () => Promise<any>;

function useDefiFetch(fetcher: Fetcher) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  return { data, loading, error };
}

function DataSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="shimmer h-24 rounded-2xl" />
      ))}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-white/30">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function PoolsTab() {
  const { data, loading, error } = useDefiFetch(useCallback(() => getLiquidityPools(), []));
  if (loading) return <DataSkeleton />;
  if (error) return <div className="text-sm text-rose-400">{error}</div>;
  const pools = data?.pools ?? [];
  return (
    <div className="mx-auto max-w-3xl">
      <div className="grid grid-cols-1 gap-3">
        {pools.map((pool: any) => (
          <div key={pool.name} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Droplets className="size-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-white">{pool.name}</div>
                <div className="text-[11px] text-white/40">on {pool.dex} · TVL {pool.tvl}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-emerald-400">{pool.apy} APY</div>
              <div className="text-[10px] text-white/30">Your liquidity: {pool.yourLiquidity}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-white/25">
        Liquidity data via the TipChain DeFi module · Orca · Raydium · Meteora
      </p>
    </div>
  );
}

function StakeTab() {
  const { data, loading, error } = useDefiFetch(useCallback(() => getStaking(), []));
  if (loading) return <DataSkeleton />;
  if (error) return <div className="text-sm text-rose-400">{error}</div>;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatChip label="Total staked" value={data?.totalStaked ?? "0"} />
        <StatChip label="Average APY" value={data?.apy ?? "0"} />
        <StatChip label="Rewards earned" value={data?.rewards ?? "0"} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        {(data?.protocols ?? []).map((p: any) => (
          <div key={p.name} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Lock className="size-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-white">{p.name}</div>
                <div className="text-[11px] text-white/40">TVL {p.tvl} · {p.staked} staked</div>
              </div>
            </div>
            <div className="font-mono text-sm font-semibold text-emerald-400">{p.apy} APY</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LendTab() {
  const { data, loading, error } = useDefiFetch(useCallback(() => getLending(), []));
  if (loading) return <DataSkeleton />;
  if (error) return <div className="text-sm text-rose-400">{error}</div>;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatChip label="Total supplied" value={data?.totalSupplied ?? "0"} />
        <StatChip label="Total borrowed" value={data?.totalBorrowed ?? "0"} />
        <StatChip label="Net APY" value={data?.netApy ?? "0"} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        {(data?.positions ?? []).map((p: any) => (
          <div key={p.protocol} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/10">
            <div>
              <div className="text-sm font-semibold text-white">{p.protocol}</div>
              <div className="text-[11px] text-white/40">{p.supplied} supplied</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-emerald-400">{p.apy} APY</div>
              <div className="text-[10px] text-white/30">Health {p.health}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YieldTab() {
  const { data, loading, error } = useDefiFetch(useCallback(() => getYieldFarming(), []));
  if (loading) return <DataSkeleton />;
  if (error) return <div className="text-sm text-rose-400">{error}</div>;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="grid grid-cols-1 gap-3">
        {(data?.farms ?? []).map((f: any) => (
          <div key={f.name} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Sprout className="size-4" />
              </span>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  {f.name}
                  {f.locked && (
                    <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/40">
                      Locked
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white/40">via {f.protocol} · rewards in {f.rewards}</div>
              </div>
            </div>
            <div className="font-mono text-sm font-semibold text-amber-400">{f.apy} APY</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TreasuryTab() {
  const { data, loading, error } = useDefiFetch(useCallback(() => getTreasury(), []));
  if (loading) return <DataSkeleton />;
  if (error) return <div className="text-sm text-rose-400">{error}</div>;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatChip label="Treasury balance" value={data?.balance ?? "0"} />
        <StatChip label="Total value" value={data?.totalValue ?? "$0"} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        {(data?.assets ?? []).map((a: any) => (
          <div key={a.token} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Gem className="size-4" />
              </span>
              <span className="text-sm font-semibold text-white">{a.token}</span>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-white">{a.amount}</div>
              <div className="text-[10px] text-white/30">{a.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BridgeTab() {
  const { data, loading, error } = useDefiFetch(useCallback(() => getCrossChainBridge(), []));
  if (loading) return <DataSkeleton />;
  if (error) return <div className="text-sm text-rose-400">{error}</div>;
  const bridges = data?.bridges ?? [];
  return (
    <div className="mx-auto max-w-3xl">
      {bridges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center text-xs text-white/40">
          Cross-chain bridge routes are warming up. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {bridges.map((b: any, i: number) => (
            <div key={i} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/10">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                  <Globe className="size-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{b.name ?? `Bridge ${i + 1}`}</div>
                  <div className="text-[11px] text-white/40">{b.from ?? ""}{b.from && b.to ? " → " : ""}{b.to ?? b.description ?? ""}</div>
                </div>
              </div>
              {b.fee && <div className="font-mono text-xs text-white/50">{b.fee}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DefiPage() {
  const [tab, setTab] = useState<TabId>("swap");

  return (
    <main className="relative flex-1 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="orb orb-1 -top-40 right-1/4 opacity-40" />
        <div className="orb orb-2 top-1/2 -left-40 opacity-30" />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-14 text-center md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
            <Zap className="size-3.5 text-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
              Phase 4 · DeFi Hub
            </span>
          </div>
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-white md:text-6xl">
            The <span className="serif-accent text-emerald-400">money layer</span>{" "}
            for your support
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-white/50 md:text-base">
            Swap, stake, lend, and grow — powered by Jupiter, the best swap
            aggregator on Solana, and the TipChain DeFi module.
          </p>
        </motion.div>
      </section>

      {/* Tabs */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.02] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="size-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active tab */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "swap" && (
              <div>
                <SwapWidget />
                <p className="mx-auto mt-6 max-w-md text-center text-[11px] leading-relaxed text-white/30">
                  Swaps route through the Jupiter aggregator for the best price.
                  Execution requires a connected wallet. Network: Solana devnet —
                  swap to mainnet for live liquidity.
                </p>
              </div>
            )}
            {tab === "pools" && <PoolsTab />}
            {tab === "stake" && <StakeTab />}
            {tab === "lend" && <LendTab />}
            {tab === "yield" && <YieldTab />}
            {tab === "treasury" && <TreasuryTab />}
            {tab === "bridge" && <BridgeTab />}
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}
