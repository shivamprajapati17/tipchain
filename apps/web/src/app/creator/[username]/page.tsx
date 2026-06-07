"use client";

import { useParams } from "next/navigation";
import { useWalletConnection, useSolTransfer, useSplToken, useWallet, useWalletSession } from "@solana/react-hooks";
import { toAddress } from "@solana/client";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Copy,
  ArrowUpRight,
  Gift,
  Globe,
  Heart,
  Send,
  Settings,
  Star,
  Users,
  Wallet,
  ChevronDown,
  Loader2,
  Check,
  MessageCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  getCreatorByUsername,
  lamportsToSol,
  recordTransaction,
  type TransactionResponse,
  type SupporterResponse,
} from "@/lib/api";

// ─── Motion Variants ────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 20 },
  },
} as const;

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

// ─── Perpetual Micro: Pulse Dot ─────────────────────────────────────────────

const PulseDot = memo(function PulseDot() {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-emerald-500"
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
});

// ─── Copy Button ────────────────────────────────────────────────────────────

const CopyButton = memo(function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2.5 py-1 font-mono text-xs text-muted-foreground hover-glass"
    >
      {label ?? truncateAddress(text)}
      <motion.span
        key={copied ? "check" : "copy"}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {copied ? (
          <Check className="size-3 text-emerald-500" />
        ) : (
          <Copy className="size-3 opacity-70" />
        )}
      </motion.span>
    </motion.button>
  );
});

// ─── Stat Pill ──────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 hover-glass-strong"
    >
      <motion.div
        className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/5 transition-colors duration-300 group-hover:bg-emerald-500/10"
        whileHover={{ scale: 1.1 }}
      >
        <Icon className="size-4.5 text-emerald-600" />
      </motion.div>
      <div>
        <p className="text-sm font-semibold tracking-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Liquid Glass Tip Card ──────────────────────────────────────────────────

function TipCard({ creatorWallet }: { creatorWallet: string }) {
  const { connect, connectors, connected } = useWalletConnection();
  const session = useWalletSession();
  const solTransfer = useSolTransfer();
  const usdcToken = useSplToken(USDC_MINT_DEVNET);

  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<"SOL" | "USDC">("SOL");
  const [message, setMessage] = useState("");
  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [sent, setSent] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowTokenPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const presetAmounts = [0.1, 0.5, 1, 5, 10];

  const isSending = solTransfer.isSending || usdcToken.isSending;
  const sendError = solTransfer.error || usdcToken.sendError;

  const handleSend = async () => {
    if (!connected || !session) {
      if (connectors.length > 0) {
        await connect(connectors[0].id);
      }
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
        const result = await solTransfer.send({
          amount: parsedAmount,
          destination,
        });
        signature = String(result);
      } else {
        const result = await usdcToken.send({
          amount: parsedAmount,
          destinationOwner: destination,
        });
        signature = String(result);
      }

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
        console.warn(
          "Failed to record transaction in backend, but on-chain tx succeeded"
        );
      }

      setSent(true);
      setAmount("");
      setMessage("");
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Transaction failed";
      if (
        !errMsg.includes("User rejected") &&
        !errMsg.includes("cancelled")
      ) {
        setTxError(errMsg);
      }
    }
  };

  const displayAmount = amount ? parseFloat(amount) : 0;
  const usdValue = token === "SOL" ? displayAmount * 145 : displayAmount;
  const isValid = displayAmount > 0;

  return (
    <motion.div
      variants={scaleIn}
      className="relative"
    >
      {/* Liquid Glass Double-Bezel */}
      <div className="rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-muted/10 p-[2px] shadow-premium">
        <div className="rounded-[calc(1.5rem-3px)] bg-card p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {/* Header */}
          <div className="mb-5 flex items-center gap-2">
            <motion.div
              className="flex size-7 items-center justify-center rounded-full bg-emerald-500/10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="size-3.5 text-emerald-600" />
            </motion.div>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Send a Tip
            </span>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSending}
                className="w-full bg-transparent pr-20 text-3xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-50"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="relative" ref={pickerRef}>
                  <motion.button
                    onClick={() => setShowTokenPicker(!showTokenPicker)}
                    disabled={isSending}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-semibold hover:bg-muted transition-colors duration-200 disabled:opacity-50"
                  >
                    {token === "SOL" ? "\u25C8" : "$"} {token}
                    <ChevronDown className="size-3 opacity-50" />
                  </motion.button>
                  <AnimatePresence>
                    {showTokenPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute right-0 top-full mt-1 w-28 rounded-xl border border-border bg-popover p-1 shadow-premium z-10"
                      >
                        {(["SOL", "USDC"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setToken(t);
                              setShowTokenPicker(false);
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                              token === t
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {t === "SOL" ? "\u25C8" : "$"} {t}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            {amount && isValid && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1 text-xs text-muted-foreground"
              >
                &asymp; ${usdValue.toLocaleString()} USD
              </motion.p>
            )}
          </div>

          {/* Preset Amounts */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {presetAmounts.map((preset) => (
              <motion.button
                key={preset}
                onClick={() => setAmount(String(preset))}
                disabled={isSending}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  amount === String(preset)
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                    : "border-border bg-background/50 text-muted-foreground hover:border-border/60 hover:bg-muted/50"
                } disabled:opacity-50`}
              >
                {token === "SOL" ? "\u25C8" : "$"}
                {preset}
              </motion.button>
            ))}
          </div>

          {/* Message */}
          <div className="mb-5">
            <div className="relative">
              <textarea
                rows={2}
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={280}
                disabled={isSending}
                className="w-full resize-none rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200 disabled:opacity-50"
              />
              <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50">
                {message.length}/280
              </span>
            </div>
          </div>

          {/* Error */}
          {(txError || !!sendError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5 shrink-0" />
              {txError ||
                (sendError instanceof Error ? sendError.message : "Transaction failed")}
            </motion.div>
          )}

          {/* Send Button */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleSend}
              disabled={!isValid || isSending}
              className="relative w-full gap-2 overflow-hidden rounded-xl py-2.5 text-sm font-semibold transition-all duration-300"
            >
              {isSending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending {token}...
                </>
              ) : sent ? (
                <>
                  <Check className="size-4" />
                  Tip Sent!
                </>
              ) : !connected ? (
                <>
                  <Wallet className="size-4" />
                  Connect Wallet to Tip
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Send {amount || "..."} {token}
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Transaction Row ────────────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: TransactionResponse }) {
  const isSol = tx.token === "SOL";
  const amountSol = lamportsToSol(tx.amount);

  return (
    <motion.div
      variants={fadeSlideUp}
      className="group flex items-center justify-between rounded-xl px-3 py-3 hover-glass"
    >
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
            isSol
              ? "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/15"
              : "bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/15"
          }`}
        >
          <Gift className="size-4" />
        </motion.div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {truncateAddress(tx.senderWallet)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{formatRelativeTime(tx.timestamp)}</span>
            {tx.message && (
              <>
                <span>·</span>
                <span className="max-w-[180px] truncate italic">
                  &ldquo;{tx.message}&rdquo;
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          +{amountSol.toFixed(amountSol < 1 ? 4 : 2)} {tx.token}
        </span>
        {tx.txHash && (
          <a
            href={`https://solscan.io/tx/${tx.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/50 hover:text-emerald-600 transition-colors duration-200"
          >
            <ArrowUpRight className="size-3.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ─── Supporter Row ──────────────────────────────────────────────────────────

function SupporterRow({
  supporter,
  rank,
}: {
  supporter: SupporterResponse;
  rank: number;
}) {
  const rankColors = [
    "bg-emerald-500/20 text-emerald-700",
    "bg-zinc-300/20 text-zinc-500",
    "bg-amber-700/20 text-amber-700",
  ];

  return (
    <motion.div
      variants={fadeSlideUp}
      className="group flex items-center justify-between rounded-xl px-3 py-3 hover-glass"
    >
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.15 }}
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            rankColors[rank - 1] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {rank}
        </motion.div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">
            {truncateAddress(supporter.walletAddress)}
          </span>
          {rank === 1 && (
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="size-3 fill-emerald-400 text-emerald-400" />
            </motion.div>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">
          {lamportsToSol(supporter.totalTipped).toFixed(2)} SOL
        </p>
        <p className="text-xs text-muted-foreground">
          {supporter.tipCount} {supporter.tipCount === 1 ? "tip" : "tips"}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Section Shell ──────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
  className,
  action,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={scaleIn}
      className={`rounded-2xl border border-border bg-card shadow-premium hover-glass-strong ${className ?? ""}`}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <Icon className="size-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-2">{children}</div>
    </motion.div>
  );
}

// ─── Empty / Error States ───────────────────────────────────────────────────

function ProfileNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-sm text-center"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
          <Users className="size-7 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-xl font-semibold">Creator Not Found</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          This creator profile doesn&apos;t exist yet.
        </p>
        <Link href="/creators">
          <Button variant="outline" className="gap-2 rounded-xl">
            Browse Creators &rarr;
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

function ProfileError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
          <AlertCircle className="size-7 text-destructive" />
        </div>
        <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={onRetry} variant="outline" className="gap-2 rounded-xl">
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex-1 animate-pulse">
      <section className="border-b border-border bg-muted/20 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              <div className="size-20 rounded-2xl bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-7 w-40 rounded-lg bg-muted" />
                <div className="h-4 w-full max-w-md rounded-md bg-muted" />
                <div className="h-4 w-3/4 rounded-md bg-muted" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Creator Avatar ─────────────────────────────────────────────────────────

function CreatorAvatar({
  username,
  avatarUrl,
  size = "lg",
}: {
  username: string;
  avatarUrl: string | null;
  size?: "sm" | "lg";
}) {
  const initials = username.slice(0, 2).toUpperCase();
  const sizeClasses =
    size === "lg" ? "size-20 text-2xl" : "size-8 text-sm";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizeClasses} rounded-2xl border border-border object-cover`}
      />
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: -3 }}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className={`${sizeClasses} flex items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 font-bold tracking-tight text-emerald-600/80 shadow-premium`}
    >
      {initials}
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

// ─── Social Link Icons ─────────────────────────────────────────────────────

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  github: GithubIcon,
  linkedin: LinkedInIcon,
  website: Globe,
};

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="2" width="20" height="20" rx="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 3.5l5.5 7.5-5.5 8h2l4-5.5 4 5.5h5l-6-8.5 5.5-7.5h-2l-3.5 5-3.5-5h-5z" />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="4" width="16" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11v5M8 8v0M12 16v-5M16 16v-3a2 2 0 00-4 0" />
    </svg>
  );
}

// ─── Social Links Row ───────────────────────────────────────────────────────

function SocialLinks({ links }: { links: Record<string, string> }) {
  const entries = Object.entries(links).filter(([, url]) => url && url.trim());
  if (entries.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
      {entries.map(([platform, url]) => {
        const Icon = SOCIAL_ICONS[platform] || ArrowUpRight;
        const labelMap: Record<string, string> = {
          instagram: "Instagram",
          twitter: "X / Twitter",
          github: "GitHub",
          linkedin: "LinkedIn",
          website: "Website",
        };
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground hover-glass transition-all duration-200"
          >
            <Icon className="size-3" />
            {labelMap[platform] || platform}
          </a>
        );
      })}
    </div>
  );
}

export default function CreatorProfilePage() {
  const params = useParams();
  const { status } = useWallet();
  const session = useWalletSession();
  const currentWallet = session?.account.address ?? "";
  const username =
    typeof params.username === "string"
      ? params.username.toLowerCase()
      : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creator, setCreator] = useState<{
    walletAddress: string;
    username: string;
    bio: string;
    avatarUrl: string | null;
    socialLinks: Record<string, string>;
    totalTips: string;
    supporterCount: number;
    createdAt: string;
  } | null>(null);
  const [recentTips, setRecentTips] = useState<TransactionResponse[]>([]);
  const [topSupporters, setTopSupporters] = useState<SupporterResponse[]>([]);
  const [notFound, setNotFound] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await getCreatorByUsername(username);
      setCreator(data.creator);
      setRecentTips(data.recentTransactions);
      setTopSupporters(data.topSupporters);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("404") || err.message.includes("not found"))
      ) {
        setNotFound(true);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load creator profile"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username, fetchProfile]);

  if (!username) return <ProfileNotFound />;
  if (loading) return <ProfileSkeleton />;
  if (notFound || (!loading && !creator)) return <ProfileNotFound />;
  if (error) return <ProfileError message={error} onRetry={fetchProfile} />;
  if (!creator) return null;

  const earnings = lamportsToSol(creator.totalTips);

  return (
    <div className="flex-1">
      {/* ── Profile Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-muted/20 px-6 py-12 sm:py-16">
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
              x: [0, -20, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="relative mx-auto max-w-6xl"
        >
          {/* Liquid Glass Hero Card */}
          <div className="rounded-2xl border border-border bg-gradient-to-b from-muted/20 to-muted/5 p-[2px] shadow-premium">
            <div className="rounded-[calc(1.5rem-3px)] bg-card p-6 sm:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                {/* Avatar */}
                <div className="flex shrink-0 justify-center sm:justify-start">
                  <CreatorAvatar
                    username={creator.username}
                    avatarUrl={creator.avatarUrl}
                    size="lg"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="mb-1 flex flex-col items-center gap-2 sm:flex-row sm:items-center">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      @{creator.username}
                    </h1>
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      <PulseDot />
                      Active
                    </div>
                  </div>

                  <p className="mb-4 max-w-lg text-sm text-muted-foreground leading-relaxed">
                    {creator.bio || "No bio yet."}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <CopyButton
                      text={creator.walletAddress}
                      label={truncateAddress(creator.walletAddress)}
                    />
                    <a
                      href={`https://solscan.io/account/${creator.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2.5 py-1 text-xs text-muted-foreground hover-glass transition-all duration-200"
                    >
                      <ArrowUpRight className="size-3" />
                      Solscan
                    </a>
                    {/* Edit Profile button — only visible to the profile owner */}
                    {currentWallet && currentWallet === creator.walletAddress && (
                      <Link href="/profile">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs">
                            <Settings className="size-3" />
                            Edit Profile
                          </Button>
                        </motion.div>
                      </Link>
                    )}
                  </div>

                  {/* Social Links */}
                  <SocialLinks links={creator.socialLinks} />
                </div>
              </div>

              {/* Stats */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-3 gap-3 sm:mt-8"
              >
                <StatPill
                  icon={Coins}
                  value={`${earnings.toFixed(2)} SOL`}
                  label="Total Earned"
                />
                <StatPill
                  icon={Heart}
                  value={String(recentTips.length)}
                  label="Recent Tips"
                />
                <StatPill
                  icon={Users}
                  value={String(creator.supporterCount)}
                  label="Supporters"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <section className="px-6 py-8 sm:py-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-6xl"
        >
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left Column — Tip Card */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                <TipCard creatorWallet={creator.walletAddress} />

                {/* Share Profile */}
                <motion.div
                  variants={fadeSlideUp}
                  className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-premium hover-glass-strong"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Share this profile
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`tipchain.xyz/creator/${creator.username}`}
                      className="flex-1 rounded-lg border border-border bg-background/50 px-3 py-2 font-mono text-xs text-muted-foreground outline-none"
                    />
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `tipchain.xyz/creator/${creator.username}`
                          );
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Column — Tips & Supporter */}
            <div className="space-y-6 lg:col-span-3">
              <Section
                title="Recent Tips"
                icon={Gift}
                action={
                  recentTips.length > 0 ? (
                    <span className="text-[11px] text-muted-foreground">
                      last {recentTips.length}
                    </span>
                  ) : undefined
                }
              >
                {recentTips.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    <AnimatePresence mode="popLayout">
                      {recentTips.map((tx) => (
                        <TransactionRow key={tx.id} tx={tx} />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="px-3 py-10 text-center">
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Gift className="mx-auto mb-3 size-6 text-muted-foreground/30" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">
                      No tips yet. Be the first to support @{creator.username}!
                    </p>
                  </div>
                )}
              </Section>

              <Section title="Top Supporters" icon={Star}>
                {topSupporters.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    <AnimatePresence mode="popLayout">
                      {topSupporters.map((s, i) => (
                        <SupporterRow
                          key={s.walletAddress}
                          supporter={s}
                          rank={i + 1}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="px-3 py-10 text-center">
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Users className="mx-auto mb-3 size-6 text-muted-foreground/30" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">
                      No supporters yet. Send a tip to become the first!
                    </p>
                  </div>
                )}
                <div className="border-t border-border px-3 pt-3 pb-1">
                  <p className="text-center text-[11px] text-muted-foreground">
                    Top supporters are ranked by total amount tipped
                  </p>
                </div>
              </Section>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
