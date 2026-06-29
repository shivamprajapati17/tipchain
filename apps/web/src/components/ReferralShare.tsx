"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Copy, Check, Loader2, RefreshCw, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReferralStats, createReferralCode } from "@/lib/api";

interface ReferralShareProps {
  creatorWallet: string;
}

export function ReferralShare({ creatorWallet }: ReferralShareProps) {
  const [codes, setCodes] = useState<any[]>([]);
  const [uses, setUses] = useState<any[]>([]);
  const [totalUses, setTotalUses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReferralStats(creatorWallet);
      setCodes(data.codes || []);
      setUses(data.uses || []);
      setTotalUses(data.totalUses || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load referral stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [creatorWallet]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await createReferralCode(creatorWallet);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(`https://tipchain.xyz/refer/${code}`);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const shareUrl = codes.length > 0 ? `https://tipchain.xyz/refer/${codes[0].code}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card shadow-premium"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <Gift className="size-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-semibold">Referrals</h2>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl text-xs"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RefreshCw className="size-3" />
            )}
            Generate Code
          </Button>
        </motion.div>
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          <div className="h-10 rounded-xl bg-muted/50 shimmer" />
          <div className="h-8 w-1/2 rounded-lg bg-muted/50 shimmer" />
        </div>
      ) : codes.length > 0 ? (
        <div className="p-4 space-y-3">
          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <Gift className="size-3" /> {codes.length} code{codes.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3" /> {totalUses} use{totalUses !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Referral codes */}
          <AnimatePresence mode="popLayout">
            {codes.map((code, i) => (
              <motion.div
                key={code.code}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="group flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2.5 hover-glass"
              >
                <div className="flex-1 min-w-0">
                  <code className="font-mono text-sm font-semibold tracking-wide">{code.code}</code>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {code.useCount} use{code.useCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCopy(code.code, i)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover-glass transition-colors"
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="size-3 text-emerald-500" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" /> Copy Link
                    </>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Share tip */}
          {shareUrl && (
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
              <p className="text-[10px] font-medium text-emerald-700 mb-1">Share your referral link</p>
              <p className="text-[10px] text-muted-foreground break-all font-mono">{shareUrl}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <Gift className="mx-auto mb-2 size-5 text-muted-foreground/30" />
          </motion.div>
          <p className="text-xs text-muted-foreground">No referral codes yet.</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Generate a code to share with friends.
          </p>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </div>
      )}
    </motion.div>
  );
}
