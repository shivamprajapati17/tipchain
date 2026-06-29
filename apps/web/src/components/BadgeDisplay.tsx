"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Loader2 } from "lucide-react";
import { getSupporterBadges, type BadgeResponse } from "@/lib/api";

interface BadgeDisplayProps {
  wallet: string;
  compact?: boolean;
}

const TIER_COLORS: Record<number, string> = {
  1: "bg-zinc-100 text-zinc-700 border-zinc-200",
  2: "bg-sky-100 text-sky-700 border-sky-200",
  3: "bg-amber-100 text-amber-700 border-amber-200",
  4: "bg-purple-100 text-purple-700 border-purple-200",
};

const TIER_NAMES: Record<number, string> = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Diamond",
};

export function BadgeDisplay({ wallet, compact = false }: BadgeDisplayProps) {
  const [badges, setBadges] = useState<BadgeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) {
      setLoading(false);
      return;
    }
    getSupporterBadges(wallet)
      .then((data) => setBadges(data.badges || []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, [wallet]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Loading badges...
      </div>
    );
  }

  if (badges.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {badges.map((badge) => (
          <motion.div
            key={`${badge.slug}-${badge.awardedAt}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              TIER_COLORS[badge.tier] || "bg-muted text-muted-foreground"
            }`}
            title={badge.description}
          >
            <Award className="size-2.5" /> {badge.name}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card shadow-premium"
    >
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
          <Award className="size-4 text-amber-600" />
        </div>
        <h2 className="text-sm font-semibold">Badges</h2>
        <span className="ml-auto text-[11px] text-muted-foreground">{badges.length} earned</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
        {badges.map((badge) => (
          <motion.div
            key={`${badge.slug}-${badge.awardedAt}`}
            whileHover={{ y: -2 }}
            className={`rounded-xl border p-3 text-center transition-all ${
              TIER_COLORS[badge.tier] || "bg-muted/30 text-muted-foreground"
            }`}
          >
            <div className="flex justify-center mb-1.5">
              <Award className="size-5" />
            </div>
            <p className="text-xs font-semibold">{badge.name}</p>
            <p className="text-[10px] opacity-70 mt-0.5">
              {TIER_NAMES[badge.tier] || `Tier ${badge.tier}`}
            </p>
            {badge.description && (
              <p className="text-[9px] opacity-60 mt-1 leading-tight">{badge.description}</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
