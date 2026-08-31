"use client";

import { useParams } from "next/navigation";
import { useWalletConnection, useSolTransfer, useSplToken, useWalletSession } from "@solana/react-hooks";
import { toAddress } from "@solana/client";
import { Button } from "@/components/ui/button";
import {
  Copy, Check, Globe, Heart, Send, Users, ArrowUpRight, Loader2, AlertCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  getCreatorByUsername, lamportsToSol, recordTransaction,
  type TransactionResponse, type SupporterResponse,
} from "@/lib/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

function truncateAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

// ─── Copy Button ────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-white/50 hover:bg-white/[0.08] transition-colors"
    >
      {truncateAddress(text)}
      {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 opacity-50" />}
    </button>
  );
}

// ─── Tip Card ───────────────────────────────────────────────────────────────

function TipCard({ creatorWallet }: { creatorWallet: string }) {
  const { connect, connectors, connected } = useWalletConnection();
  const session = useWalletSession();
  const solTransfer = useSolTransfer();
  const usdcToken = useSplToken(USDC_MINT_DEVNET);

  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<"SOL" | "USDC">("SOL");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const isSending = solTransfer.isSending || usdcToken.isSending;

  const presetAmounts = [0.1, 0.5, 1, 5];

  const handleSend = async () => {
    if (!connected || !session) {
      if (connectors.length > 0) await connect(connectors[0].id);
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setTxError(null);
    setSent(false);

    try {
      let signature: string;
      const destination = toAddress(creatorWallet);

      if (token === "SOL") {
        const result = await solTransfer.send({ amount: parsedAmount, destination });
        signature = String(result);
      } else {
        const result = await usdcToken.send({ amount: parsedAmount, destinationOwner: destination });
        signature = String(result);
      }

      // Record in backend (best-effort)
      try {
        await recordTransaction({
          senderWallet: session.account.address,
          receiverWallet: creatorWallet,
          amount: parsedAmount,
          token,
          txHash: signature,
          message: message.trim() || undefined,
        });
      } catch {
        console.warn("Failed to record in backend, on-chain tx succeeded");
      }

      setSent(true);
      setAmount("");
      setMessage("");
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Transaction failed";
      if (!errMsg.includes("User rejected") && !errMsg.includes("cancelled")) {
        setTxError(errMsg);
      }
    }
  };

  const displayAmount = amount ? parseFloat(amount) : 0;
  const isValid = displayAmount > 0;

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/10">
          <Heart className="size-3.5 text-emerald-400" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/40">
          Send a Tip
        </span>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <input
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-transparent text-3xl font-bold tracking-tight text-white outline-none placeholder:text-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-50"
          />
          <button
            onClick={() => setToken(token === "SOL" ? "USDC" : "SOL")}
            className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-white/70 hover:bg-white/[0.1] transition-colors"
          >
            {token}
          </button>
        </div>
        {amount && isValid && (
          <p className="mt-1 text-xs text-white/30">
            &asymp; ${token === "SOL" ? (displayAmount * 145).toLocaleString() : displayAmount.toLocaleString()} USD
          </p>
        )}
      </div>

      {/* Preset Amounts */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {presetAmounts.map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(String(preset))}
            disabled={isSending}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              amount === String(preset)
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-white/5 bg-white/[0.03] text-white/50 hover:border-white/10 hover:text-white/70"
            }`}
          >
            {preset} {token}
          </button>
        ))}
      </div>

      {/* Message */}
      <div className="mb-4">
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message (optional)"
          disabled={isSending}
          className="w-full resize-none rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-500/20 transition-all disabled:opacity-50"
        />
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5"
          >
            <Check className="size-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Tip sent successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {txError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5"
          >
            <AlertCircle className="size-4 text-red-400" />
            <span className="text-xs font-medium text-red-400">{txError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Button */}
      <Button
        onClick={handleSend}
        disabled={isSending || !isValid}
        className="w-full gap-2 rounded-xl"
      >
        {isSending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending...
          </>
        ) : !connected ? (
          <>
            <Send className="size-4" />
            Connect Wallet to Tip
          </>
        ) : (
          <>
            <Send className="size-4" />
            Send {amount ? `${amount} ${token}` : "Tip"}
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function CreatorSkeleton() {
  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="mb-8 h-8 w-48 rounded-lg bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <div className="h-48 rounded-2xl border border-white/5 bg-white/[0.03]" />
            <div className="h-64 rounded-2xl border border-white/5 bg-white/[0.03]" />
          </div>
          <div className="h-96 rounded-2xl border border-white/5 bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

// ─── Not Found ──────────────────────────────────────────────────────────────

function CreatorNotFound({ username }: { username: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="mb-2 text-xl font-semibold text-white">Creator not found</h1>
        <p className="mb-6 text-sm text-white/40">
          No creator profile found for &ldquo;{username}&rdquo;.
        </p>
        <Link href="/creators">
          <Button variant="outline" className="rounded-xl">Browse Creators</Button>
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CreatorPage() {
  const params = useParams();
  const username = params.username as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creator, setCreator] = useState<any>(null);
  const [recentTx, setRecentTx] = useState<TransactionResponse[]>([]);
  const [supporters, setSupporters] = useState<SupporterResponse[]>([]);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getCreatorByUsername(username)
      .then((data) => {
        setCreator(data.creator);
        setRecentTx(data.recentTransactions?.slice(0, 5) || []);
        setSupporters(data.topSupporters?.slice(0, 5) || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <CreatorSkeleton />;
  if (error || !creator) return <CreatorNotFound username={username} />;

  const initials = creator.username.slice(0, 2).toUpperCase();
  const earnings = lamportsToSol(creator.totalTips);

  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {/* ── Creator Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-white/5 bg-white/[0.03] p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 font-bold text-lg text-emerald-400">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {creator.displayName || creator.username}
                </h1>
                <motion.span
                  className="inline-block size-2 rounded-full bg-emerald-500"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="text-sm text-white/40">@{creator.username}</p>
              {creator.bio && (
                <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-lg">{creator.bio}</p>
              )}
            </div>
          </div>

          {/* Social Links */}
          {creator.socialLinks && Object.keys(creator.socialLinks).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(creator.socialLinks).map(([platform, url]) => {
                if (!url) return null;
                return (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.04] px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors capitalize"
                  >
                    {platform}
                    <ArrowUpRight className="size-3" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <p className="text-lg font-bold text-white">{earnings.toFixed(2)}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">SOL Earned</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <p className="text-lg font-bold text-white">{creator.supporterCount}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Supporters</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <p className="text-lg font-bold text-white">{recentTx.length}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Recent Tips</p>
            </div>
          </div>
        </motion.div>

        {/* ── Main Content ───────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left: Recent Tips & Supporters */}
          <div className="space-y-6">
            {/* Recent Tips */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <Send className="size-4 text-white/30" />
                <h2 className="text-sm font-semibold text-white">Recent Tips</h2>
              </div>
              {recentTx.length > 0 ? (
                <div className="space-y-2">
                  {recentTx.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-emerald-500/50" />
                        <span className="font-mono text-xs text-white/60">
                          {truncateAddress(tx.senderWallet)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-white/80">
                          {lamportsToSol(tx.amount).toFixed(2)} {tx.token}
                        </p>
                        <p className="text-[10px] text-white/30">{formatRelativeTime(tx.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-white/30">No tips yet</p>
              )}
            </motion.div>

            {/* Top Supporters */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <Users className="size-4 text-white/30" />
                <h2 className="text-sm font-semibold text-white">Top Supporters</h2>
              </div>
              {supporters.length > 0 ? (
                <div className="space-y-2">
                  {supporters.map((s, i) => (
                    <div key={s.walletAddress} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${
                          i === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"
                        }`}>
                          {i + 1}
                        </div>
                        <span className="font-mono text-xs text-white/60">
                          {truncateAddress(s.walletAddress)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-white/80">
                          {lamportsToSol(s.totalTipped).toFixed(2)} SOL
                        </p>
                        <p className="text-[10px] text-white/30">{s.tipCount} tips</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-white/30">No supporters yet</p>
              )}
            </motion.div>
          </div>

          {/* Right: Tip Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="lg:sticky lg:top-24">
              <TipCard creatorWallet={creator.walletAddress} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
