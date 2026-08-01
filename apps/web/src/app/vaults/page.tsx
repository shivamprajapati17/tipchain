"use client";

import { useWallet, useWalletSession } from "@solana/react-hooks";
import {
  Vault as VaultIcon,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  Coins,
  ArrowUpRight,
  Trash2,
  Shield,
  Share2,
  Send,
  X,
  Wallet,
  Crown,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  getVaults,
  getVault,
  createVault,
  updateVault,
  deleteVault,
  supportVault,
  lamportsToSol,
  type VaultResponse,
} from "@/lib/api";

// ─── Motion Variants ────────────────────────────────────────────────────────

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 20 },
  },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
} as const;

function truncateAddress(address: string) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ─── Not Connected ──────────────────────────────────────────────────────────

function NotConnected() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
          <VaultIcon className="size-7 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-xl font-semibold">Creator Vaults</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Support a curated basket of creators with a single tip — your SOL is
          split across them automatically, Hyperliquid-vault style.
        </p>
        <p className="text-xs text-muted-foreground">
          Browse vaults below without connecting, or connect your wallet to
          create one and support vaults.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Vault Card ─────────────────────────────────────────────────────────────

function VaultCard({
  vault,
  onSupport,
  onDelete,
  onEdit,
  isOwner,
}: {
  vault: VaultResponse;
  onSupport: (v: VaultResponse) => void;
  onDelete?: (v: VaultResponse) => void;
  onEdit?: (v: VaultResponse) => void;
  isOwner?: boolean;
}) {
  return (
    <motion.div variants={fadeSlideUp} layout>
      <motion.div
        whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        className="relative h-full overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/20 to-muted/5 p-[2px] shadow-premium transition-all duration-500 hover:shadow-premium-lg"
      >
        <div className="flex h-full flex-col rounded-[calc(1.5rem-3px)] bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="p-5 flex flex-col flex-1">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
                <VaultIcon className="size-5 text-violet-400" />
              </div>
              {isOwner ? (
                <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                  <Crown className="size-3" /> Owner
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                  <Shield className="size-3" /> Verified
                </span>
              )}
            </div>

            <h3 className="mb-1 text-sm font-semibold leading-snug">
              {vault.name}
            </h3>
            <p className="mb-4 flex-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {vault.description || "A curated basket of creators on TipChain."}
            </p>

            {/* Creators + allocations */}
            <div className="mb-2 flex flex-wrap gap-1.5">
              {vault.creatorWallets.slice(0, 4).map((w, i) => (
                <span
                  key={w}
                  className="rounded-full border border-border bg-muted/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {truncateAddress(w)}
                  {vault.allocations?.length > 1
                    ? ` ${allocationPercent(vault.allocations, i)}%`
                    : ""}
                </span>
              ))}
              {vault.creatorWallets.length > 4 && (
                <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{vault.creatorWallets.length - 4}
                </span>
              )}
            </div>
            {vault.allocations?.length > 1 && (
              <p className="mb-3 text-[10px] text-muted-foreground/60">
                Split: {formatAllocations(vault.allocations)}
              </p>
            )}

            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                <p className="text-xs font-bold tracking-tight">
                  {lamportsToSol(vault.totalTipped).toFixed(2)} SOL
                </p>
                <p className="text-[10px] text-muted-foreground">Tipped</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                <p className="text-xs font-bold tracking-tight">
                  {vault.supporterCount}
                </p>
                <p className="text-[10px] text-muted-foreground">Supporters</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-[10px] text-muted-foreground">
                {vault.creatorWallets.length}{" "}
                {vault.creatorWallets.length === 1 ? "creator" : "creators"}
              </span>
              <div className="flex items-center gap-1.5">
                {onDelete && isOwner && (
                  <>
                    {onEdit && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEdit(vault)}
                        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-violet-500 transition-colors"
                        title="Edit allocations"
                      >
                        <SlidersHorizontal className="size-3.5" />
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(vault)}
                      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-destructive transition-colors"
                      title="Delete vault"
                    >
                      <Trash2 className="size-3.5" />
                    </motion.button>
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSupport(vault)}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
                >
                  <Send className="size-3" /> Support
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Allocation helper ──────────────────────────────────────────────────────

function allocationPercent(weights: number[], index: number): number {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  return Math.round(((weights[index] ?? 1) / total) * 100);
}

function formatAllocations(weights: number[]): string {
  if (!weights || weights.length === 0) return "Equal split";
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  return weights
    .map((w) => `${Math.round((w / total) * 100)}%`)
    .join(" · ");
}

// ─── Creator Weight Row (shared by create + edit modals) ────────────────────

function CreatorWeightRow({
  wallet,
  weight,
  onWeightChange,
  onRemove,
}: {
  wallet: string;
  weight: number;
  onWeightChange: (w: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
      <span className="flex-1 min-w-0 truncate font-mono text-[11px] text-muted-foreground">
        {truncateAddress(wallet)}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        <input
          type="number"
          min="1"
          step="1"
          value={weight}
          onChange={(e) => onWeightChange(Math.max(1, Number(e.target.value) || 1))}
          className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-center text-xs outline-none focus:border-violet-500/30 transition-all"
          title="Allocation weight"
        />
        <button
          onClick={onRemove}
          className="text-muted-foreground/50 hover:text-destructive transition-colors"
          title="Remove creator"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Create Vault Modal ─────────────────────────────────────────────────────

function CreateVaultModal({
  onClose,
  onCreated,
  walletAddress,
}: {
  onClose: () => void;
  onCreated: () => void;
  walletAddress: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creatorInput, setCreatorInput] = useState("");
  const [creators, setCreators] = useState<{ wallet: string; weight: number }[]>(
    []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCreator = () => {
    const w = creatorInput.trim();
    if (w && !creators.some((c) => c.wallet === w)) {
      setCreators((prev) => [...prev, { wallet: w, weight: 1 }]);
    }
    setCreatorInput("");
  };

  const setWeight = (wallet: string, weight: number) => {
    setCreators((prev) =>
      prev.map((c) => (c.wallet === wallet ? { ...c, weight } : c))
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || creators.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await createVault({
        name,
        description,
        ownerWallet: walletAddress,
        creatorWallets: creators.map((c) => c.wallet),
        allocations: creators.map((c) => c.weight),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vault");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-premium-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10">
              <VaultIcon className="size-4 text-violet-500" />
            </div>
            <h2 className="text-sm font-semibold">Create Vault</h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </motion.button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Vault Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Solana Builders Basket"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this basket special?"
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Creator Wallets
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={creatorInput}
                onChange={(e) => setCreatorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCreator();
                  }
                }}
                placeholder="Solana wallet address"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground/50 focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10 transition-all"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1 rounded-xl"
                onClick={addCreator}
              >
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
            {creators.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {creators.map((c) => (
                  <CreatorWeightRow
                    key={c.wallet}
                    wallet={c.wallet}
                    weight={c.weight}
                    onWeightChange={(w) => setWeight(c.wallet, w)}
                    onRemove={() =>
                      setCreators((prev) =>
                        prev.filter((x) => x.wallet !== c.wallet)
                      )
                    }
                  />
                ))}
                <p className="text-[10px] text-muted-foreground/70 pt-1">
                  Split: {formatAllocations(creators.map((c) => c.weight))}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={saving || !name.trim() || creators.length === 0}
            className="w-full gap-2 rounded-xl"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <VaultIcon className="size-4" /> Create Vault
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Edit Vault Modal (owner: name/description/creators/allocations) ────────

function EditVaultModal({
  vault,
  onClose,
  onSaved,
}: {
  vault: VaultResponse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(vault.name);
  const [description, setDescription] = useState(vault.description);
  const [creatorInput, setCreatorInput] = useState("");
  const [creators, setCreators] = useState<{ wallet: string; weight: number }[]>(
    vault.creatorWallets.map((w, i) => ({
      wallet: w,
      weight: vault.allocations?.[i] ?? 1,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCreator = () => {
    const w = creatorInput.trim();
    if (w && !creators.some((c) => c.wallet === w)) {
      setCreators((prev) => [...prev, { wallet: w, weight: 1 }]);
    }
    setCreatorInput("");
  };

  const setWeight = (wallet: string, weight: number) => {
    setCreators((prev) =>
      prev.map((c) => (c.wallet === wallet ? { ...c, weight } : c))
    );
  };

  const handleSave = async () => {
    if (!name.trim() || creators.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await updateVault(vault.id, {
        name: name.trim(),
        description: description.trim(),
        creatorWallets: creators.map((c) => c.wallet),
        allocations: creators.map((c) => c.weight),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vault");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-premium-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10">
              <SlidersHorizontal className="size-4 text-violet-500" />
            </div>
            <h2 className="text-sm font-semibold">Edit Vault</h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </motion.button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Vault Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Creators &amp; Allocation Weights
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={creatorInput}
                onChange={(e) => setCreatorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCreator();
                  }
                }}
                placeholder="Add a creator wallet"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-xs outline-none placeholder:text-muted-foreground/50 focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10 transition-all"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1 rounded-xl"
                onClick={addCreator}
              >
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
            {creators.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {creators.map((c) => (
                  <CreatorWeightRow
                    key={c.wallet}
                    wallet={c.wallet}
                    weight={c.weight}
                    onWeightChange={(w) => setWeight(c.wallet, w)}
                    onRemove={() =>
                      setCreators((prev) =>
                        prev.filter((x) => x.wallet !== c.wallet)
                      )
                    }
                  />
                ))}
                <p className="text-[10px] text-muted-foreground/70 pt-1">
                  Split: {formatAllocations(creators.map((c) => c.weight))}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || !name.trim() || creators.length === 0}
            className="w-full gap-2 rounded-xl"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <SlidersHorizontal className="size-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Support Vault Modal ────────────────────────────────────────────────────

function SupportModal({
  vault,
  onClose,
  walletAddress,
  onSupported,
}: {
  vault: VaultResponse;
  onClose: () => void;
  walletAddress: string;
  onSupported: () => void;
}) {
  const [amount, setAmount] = useState("1");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    splits: { creatorWallet: string; amount: string }[];
  } | null>(null);

  const handleSupport = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await supportVault({
        vaultId: vault.id,
        supporterWallet: walletAddress,
        amount: Number(amount),
        token: "SOL",
        message: `Vault: ${vault.name}`,
      });
      setResult(res);
      onSupported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to support vault");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-premium-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Support {vault.name}</h2>
            <p className="text-xs text-muted-foreground">
              Split across {vault.creatorWallets.length} creators
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </motion.button>
        </div>

        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
              <p className="text-lg font-bold text-emerald-500">
                {amount} SOL split!
              </p>
              <p className="text-xs text-muted-foreground">
                Your tip was distributed across the vault&apos;s creators.
              </p>
            </div>
            <div className="space-y-2">
              {result.splits.map((s) => (
                <div
                  key={s.creatorWallet}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {truncateAddress(s.creatorWallet)}
                  </span>
                  <span className="text-xs font-semibold">
                    {lamportsToSol(s.amount).toFixed(4)} SOL
                  </span>
                </div>
              ))}
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full rounded-xl"
            >
              Done
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Amount (SOL)
              </label>
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/10 transition-all"
              />
              <div className="mt-2 flex gap-1.5">
                {["0.5", "1", "5", "10"].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    className="rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {a} SOL
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleSupport}
              disabled={sending || !amount || Number(amount) <= 0}
              className="w-full gap-2 rounded-xl"
            >
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Splitting...
                </>
              ) : (
                <>
                  <Send className="size-4" /> Support with {amount || "0"} SOL
                </>
              )}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              Transactions are recorded on-chain and split equally (or by
              allocation) across creators.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function VaultsPage() {
  const { status } = useWallet();
  const session = useWalletSession();
  const walletAddress = session?.account.address ?? "";
  const connected = status === "connected" && !!session;

  const [vaults, setVaults] = useState<VaultResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [supportTarget, setSupportTarget] = useState<VaultResponse | null>(null);
  const [editTarget, setEditTarget] = useState<VaultResponse | null>(null);
  const [connectPrompt, setConnectPrompt] = useState(false);

  const fetchVaults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVaults(24, 0);
      setVaults(data.vaults || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vaults");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const handleSupportClick = (vault: VaultResponse) => {
    if (!connected) {
      setConnectPrompt(true);
      setTimeout(() => setConnectPrompt(false), 4000);
      return;
    }
    setSupportTarget(vault);
  };

  const handleDelete = async (vault: VaultResponse) => {
    if (!window.confirm(`Delete vault "${vault.name}"?`)) return;
    try {
      await deleteVault(vault.id, walletAddress);
      await fetchVaults();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vault");
    }
  };

  const handleRefresh = () => {
    fetchVaults();
    if (supportTarget) {
      getVault(supportTarget.id).then((v) => setSupportTarget(v)).catch(() => {});
    }
  };

  const totalTipped = useMemo(
    () => vaults.reduce((s, v) => s + lamportsToSol(v.totalTipped), 0),
    [vaults]
  );

  return (
    <div className="flex-1 px-6 py-8">
      {/* Gradient mesh */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-32 -top-32 size-[500px] rounded-full opacity-10 dark:opacity-5"
          style={{
            background:
              "radial-gradient(circle at 30% 50%, oklch(0.5 0.2 300), transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto max-w-6xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10"
              whileHover={{ scale: 1.1 }}
            >
              <VaultIcon className="size-5 text-violet-500" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Creator Vaults
              </h1>
              <p className="text-sm text-muted-foreground">
                Support a basket of creators with one tip — split automatically
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl text-xs"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RefreshCw className="size-3" />
              )}
              Refresh
            </Button>
            {connected && (
              <Button
                size="sm"
                className="gap-1.5 rounded-xl text-xs"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="size-3.5" /> Create Vault
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-3 gap-3 max-w-md"
        >
          <div className="rounded-2xl border border-border bg-card p-4 shadow-premium">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Vaults
            </p>
            <p className="text-lg font-bold tracking-tight">{vaults.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-premium">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total Tipped
            </p>
            <p className="text-lg font-bold tracking-tight">
              {totalTipped.toFixed(2)} SOL
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-premium">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Supporters
            </p>
            <p className="text-lg font-bold tracking-tight">
              {vaults.reduce((s, v) => s + v.supporterCount, 0)}
            </p>
          </div>
        </motion.div>

        {/* Connect prompt */}
        <AnimatePresence>
          {connectPrompt && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-xs text-blue-500"
            >
              <Wallet className="size-3.5 shrink-0" />
              Connect your wallet to support vaults — browsing works without
              connecting.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-xs text-destructive"
          >
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
            <button
              onClick={fetchVaults}
              className="ml-auto underline hover:no-underline"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Vaults grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl border border-border bg-card overflow-hidden relative"
              >
                <div className="absolute inset-0 shimmer-slow" />
              </div>
            ))}
          </div>
        ) : vaults.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {vaults.map((vault) => (
                <VaultCard
                  key={vault.id}
                  vault={vault}
                  isOwner={connected && vault.ownerWallet === walletAddress}
                  onSupport={handleSupportClick}
                  onEdit={
                    connected && vault.ownerWallet === walletAddress
                      ? setEditTarget
                      : undefined
                  }
                  onDelete={
                    connected && vault.ownerWallet === walletAddress
                      ? handleDelete
                      : undefined
                  }
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center"
          >
            <VaultIcon className="mb-4 size-8 text-muted-foreground/30" />
            <h2 className="mb-2 text-lg font-semibold">No vaults yet</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Vaults let you support a curated set of creators with a single
              tip. Be the first to create one!
            </p>
            {connected && (
              <Button
                className="gap-2 rounded-xl"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="size-4" /> Create Vault
              </Button>
            )}
          </motion.div>
        )}

        {/* Info strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid gap-4 sm:grid-cols-3"
        >
          <div className="rounded-2xl border border-border bg-card p-4 shadow-premium">
            <div className="mb-1 flex items-center gap-2">
              <Coins className="size-4 text-violet-500/70" />
              <h3 className="text-xs font-semibold">Auto-split</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your tip is divided across the vault&apos;s creators and recorded
              as separate on-chain transactions.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-premium">
            <div className="mb-1 flex items-center gap-2">
              <Users className="size-4 text-violet-500/70" />
              <h3 className="text-xs font-semibold">Diversify</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Support emerging creators alongside established names in a single
              action — no per-creator transactions needed.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-premium">
            <div className="mb-1 flex items-center gap-2">
              <Share2 className="size-4 text-violet-500/70" />
              <h3 className="text-xs font-semibold">Share & grow</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Vault owners can share their basket link to rally supporters and
              grow their curated creator list.
            </p>
          </div>
        </motion.div>

        {/* Wallet hint */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-premium"
          >
            <Wallet className="size-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Connect your wallet to create vaults and support them with SOL.
            </p>
          </motion.div>
        )}

        {/* Link back */}
        <div className="mt-6 text-center">
          <Link
            href="/creators"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Browse Creators <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && connected && (
          <CreateVaultModal
            walletAddress={walletAddress}
            onClose={() => setShowCreate(false)}
            onCreated={fetchVaults}
          />
        )}
        {supportTarget && connected && (
          <SupportModal
            vault={supportTarget}
            walletAddress={walletAddress}
            onClose={() => setSupportTarget(null)}
            onSupported={() => {
              fetchVaults();
            }}
          />
        )}
        {editTarget && connected && (
          <EditVaultModal
            vault={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={fetchVaults}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
