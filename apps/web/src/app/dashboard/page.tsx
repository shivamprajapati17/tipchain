"use client";

import { useWallet, useWalletSession, useBalance } from "@solana/react-hooks";
import {
  LayoutDashboard, Users, Wallet, TrendingUp, Gift, ExternalLink, Copy, Check,
  AlertCircle, RefreshCw, User, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getCreatorByWallet, getTransactions, lamportsToSol,
  type TransactionResponse, type SupporterResponse,
} from "@/lib/api";

function truncateAddress(address: string) {
  if (!address || address.length < 12) return address;
  return address.slice(0, 8) + "..." + address.slice(-8);
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  if (hours < 24) return hours + "h ago";
  if (days < 7) return days + "d ago";
  return new Date(isoString).toLocaleDateString();
}

const PulseDot = memo(function PulseDot() {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-emerald-500"
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
});

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-white/50 hover:bg-white/[0.08] transition-colors"
    >
      {truncateAddress(address)}
      {copied ? <span className="text-emerald-400 text-[10px]">Copied!</span> : <Copy className="size-3" />}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color = "emerald" }: {
  icon: React.ElementType; label: string; value: string; color?: string;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
    purple: "bg-purple-500/10 text-purple-400",
  };
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <div className={"mb-2 inline-flex size-8 items-center justify-center rounded-lg " + colors[color]}>
        <Icon className="size-4" />
      </div>
      <p className="text-lg font-bold tracking-tight text-white">{value}</p>
      <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
        <div className="h-7 w-48 rounded-lg bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[100px] rounded-2xl border border-white/5 bg-white/[0.03]" />)}
        </div>
      </div>
    </div>
  );
}

function NotConnected() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
          <LayoutDashboard className="size-7 text-white/30" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-white">Dashboard</h1>
        <p className="mb-6 text-sm text-white/40">Connect your wallet to view your dashboard, earnings, and supporter activity.</p>
      </motion.div>
    </div>
  );
}

function NoProfile({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]">
          <User className="size-7 text-white/30" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-white">Create Your Creator Profile</h1>
        <p className="mb-6 text-sm text-white/40 leading-relaxed">Set up your creator profile to start receiving tips.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/profile"><Button className="gap-2 rounded-xl w-full sm:w-auto"><User className="size-4" /> Create Profile</Button></Link>
          <Button onClick={onRefresh} variant="outline" className="gap-2 rounded-xl w-full sm:w-auto"><RefreshCw className="size-4" /> Refresh</Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const { status } = useWallet();
  const session = useWalletSession();
  const walletAddress = session?.account.address ?? "";
  const { lamports, fetching: balanceFetching } = useBalance(walletAddress, { fetch: true, watch: true });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<{ username: string; bio: string; totalTips: number; supporterCount: number; createdAt: string } | null>(null);
  const [recentTips, setRecentTips] = useState<TransactionResponse[]>([]);
  const [topSupporters, setTopSupporters] = useState<SupporterResponse[]>([]);

  const fetchDashboard = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const d = await getCreatorByWallet(walletAddress);
      const p = d.creator;
      setCreatorProfile({ username: p.username, bio: p.bio, totalTips: lamportsToSol(p.totalTips), supporterCount: p.supporterCount, createdAt: p.createdAt });
      setTopSupporters(d.topSupporters.slice(0, 5));
      setRecentTips(d.recentTransactions.slice(0, 5));
      setProfileExists(true);
    } catch (err) {
      if (err instanceof Error && (err.message.includes("404") || err.message.includes("not found"))) {
        setProfileExists(false);
        try { const t = await getTransactions(walletAddress, 5); setRecentTips(t.transactions); } catch { /* silent */ }
      } else {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      }
    } finally { setLoading(false); }
  }, [walletAddress]);

  useEffect(() => { if (walletAddress) fetchDashboard(); }, [walletAddress, fetchDashboard]);

  if (status !== "connected" || !session) return <NotConnected />;
  if (loading) return <DashboardSkeleton />;
  if (error) return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <AlertCircle className="mx-auto mb-4 size-8 text-red-400" />
        <h1 className="mb-2 text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mb-4 text-sm text-white/40">{error}</p>
        <Button onClick={fetchDashboard} variant="outline" className="gap-2 rounded-xl"><RefreshCw className="size-4" /> Try Again</Button>
      </motion.div>
    </div>
  );
  if (!profileExists) return <NoProfile onRefresh={fetchDashboard} />;

  const solBalance = lamports !== null ? (Number(lamports) / 1e9).toFixed(4) + " SOL" : "\u2014";

  return (
    <div className="flex-1 px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <LayoutDashboard className="size-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <CopyAddress address={walletAddress} />
            <span className="text-xs text-white/40">{balanceFetching ? "\u2014" : solBalance}</span>
            <PulseDot />
          </div>
        </div>
        {creatorProfile && (
          <Link href={"/creator/" + creatorProfile.username}>
            <Button size="sm" className="gap-1.5 rounded-xl"><ExternalLink className="size-4" /> View Profile</Button>
          </Link>
        )}
      </motion.div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Wallet} label="Balance" value={balanceFetching ? "\u2014" : solBalance} />
        <StatCard icon={TrendingUp} label="Earned" value={(creatorProfile?.totalTips?.toFixed(2) ?? "0") + " SOL"} color="blue" />
        <StatCard icon={Users} label="Supporters" value={String(creatorProfile?.supporterCount ?? 0)} color="amber" />
        <StatCard icon={Gift} label="Tips" value={String(recentTips.length)} color="purple" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="size-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Recent Tips</h2>
          </div>
          {recentTips.length > 0 ? (
            <div className="space-y-2">
              {recentTips.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500/50" />
                    <span className="font-mono text-xs text-white/60">{truncateAddress(tx.senderWallet)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white/80">{lamportsToSol(tx.amount).toFixed(2)} {tx.token}</p>
                    <p className="text-[10px] text-white/30">{formatRelativeTime(tx.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="py-8 text-center text-xs text-white/30">No recent tips</p>}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Top Supporters</h2>
          </div>
          {topSupporters.length > 0 ? (
            <div className="space-y-2">
              {topSupporters.map((s, i) => (
                <div key={s.walletAddress} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={"flex size-6 items-center justify-center rounded-full text-[10px] font-bold " + (i === 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40")}>{i + 1}</div>
                    <span className="font-mono text-xs text-white/60">{truncateAddress(s.walletAddress)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white/80">{lamportsToSol(s.totalTipped).toFixed(2)} SOL</p>
                    <p className="text-[10px] text-white/30">{s.tipCount} tips</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="py-8 text-center text-xs text-white/30">No supporters yet</p>}
        </div>
      </div>
    </div>
  );
}
