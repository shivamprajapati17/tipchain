"use client";

import { useWallet, useWalletSession } from "@solana/react-hooks";
import { History, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, RefreshCw, Filter, Inbox, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTransactions, lamportsToSol } from "@/lib/api";

const TOKENS = ["ALL", "SOL", "USDC"];
const DIRECTIONS = ["all", "sent", "received"];
const DAYS = [{ key: "", label: "All" }, { key: "7", label: "7D" }, { key: "30", label: "30D" }, { key: "90", label: "90D" }];

function truncateAddress(address: string) {
  if (!address || address.length < 12) return address;
  return address.slice(0, 6) + "..." + address.slice(-4);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function NotConnected() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
          <History className="size-7 text-white/30" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-white">Tip History</h1>
        <p className="mb-6 text-sm text-white/40">Connect your wallet to browse every tip you&apos;ve sent and received.</p>
      </motion.div>
    </div>
  );
}

export default function HistoryPage() {
  const { status } = useWallet();
  const session = useWalletSession();
  const walletAddress = session?.account.address ?? "";

  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("ALL");
  const [direction, setDirection] = useState("all");
  const [days, setDays] = useState("");
  const [limit, setLimit] = useState(25);

  const fetchHistory = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions(walletAddress, limit, { token, direction, days });
      setTxs(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally { setLoading(false); }
  }, [walletAddress, token, direction, days, limit]);

  useEffect(() => { if (walletAddress) fetchHistory(); else setLoading(false); }, [walletAddress, fetchHistory]);

  if (status !== "connected" || !session) return <NotConnected />;

  const totalSent = txs.filter((t) => t.direction === "sent").reduce((s, t) => s + lamportsToSol(t.amount), 0);
  const totalReceived = txs.filter((t) => t.direction !== "sent").reduce((s, t) => s + lamportsToSol(t.amount), 0);

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <History className="size-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Tip <span className="serif-accent text-emerald-400">History</span></h1>
              <p className="text-sm text-white/40">Every tip you&apos;ve sent and received, on-chain</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Sent", value: totalSent.toFixed(2) + " SOL", color: "text-blue-400" },
            { label: "Received", value: totalReceived.toFixed(2) + " SOL", color: "text-emerald-400" },
            { label: "Transactions", value: String(txs.length), color: "text-white" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/30">{s.label}</p>
              <p className={"text-lg font-bold tracking-tight " + s.color}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 text-white/40">
            <Filter className="size-3.5" />
            <span className="text-xs font-medium">Filters</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
            {TOKENS.map((t) => (
              <button key={t} onClick={() => setToken(t)} className={"rounded-md px-3 py-1 text-xs font-medium transition-all " + (token === t ? "bg-emerald-500/15 text-emerald-400" : "text-white/40 hover:text-white/70")}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
            {DIRECTIONS.map((d) => (
              <button key={d} onClick={() => setDirection(d)} className={"rounded-md px-3 py-1 text-xs font-medium capitalize transition-all " + (direction === d ? "bg-blue-500/15 text-blue-400" : "text-white/40 hover:text-white/70")}>{d}</button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
            {DAYS.map((d) => (
              <button key={d.label} onClick={() => setDays(d.key)} className={"rounded-md px-3 py-1 text-xs font-medium transition-all " + (days === d.key ? "bg-amber-500/15 text-amber-400" : "text-white/40 hover:text-white/70")}>{d.label}</button>
            ))}
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs" onClick={fetchHistory} disabled={loading}>
              {loading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />} Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-400">
            <AlertCircle className="size-3.5 shrink-0" /> {error}
            <button onClick={fetchHistory} className="ml-auto underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Transactions */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.03]">
          <div className="border-b border-white/5 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">Transactions</h2>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">{[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/[0.03] shimmer" />)}</div>
          ) : txs.length > 0 ? (
            <div className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {txs.map((tx) => {
                  const isSent = tx.direction === "sent";
                  return (
                    <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                      <div className={"flex size-9 shrink-0 items-center justify-center rounded-xl border " + (isSent ? "border-blue-500/20 bg-blue-500/10 text-blue-400" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400")}>
                        {isSent ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {isSent ? "Sent tip to" : "Received tip from"} <span className="font-mono text-xs text-white/60">{truncateAddress(isSent ? tx.receiverWallet : tx.senderWallet)}</span>
                        </p>
                        <p className="text-[10px] text-white/30">{formatTime(tx.timestamp)} · {tx.token}{tx.message ? " · \"" + tx.message + "\"" : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={"text-sm font-bold " + (isSent ? "text-blue-400" : "text-emerald-400")}>{isSent ? "\u2212" : "+"}{lamportsToSol(tx.amount).toFixed(4)} {tx.token}</p>
                        {tx.txHash && <a href={"https://solscan.io/tx/" + tx.txHash} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/20 hover:text-emerald-400 transition-colors">View on Solscan</a>}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="px-5 py-14 text-center">
              <Inbox className="mx-auto mb-3 size-6 text-white/15" />
              <p className="text-sm text-white/40">No transactions match these filters.</p>
            </div>
          )}
        </div>

        {txs.length >= limit && !loading && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs" onClick={() => setLimit((l) => l + 25)}>Load More</Button>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4">
          <Wallet className="size-4 text-white/30" />
          <p className="text-xs text-white/40">Showing history for <code className="font-mono text-white/50">{truncateAddress(walletAddress)}</code></p>
        </div>
      </div>
    </div>
  );
}
