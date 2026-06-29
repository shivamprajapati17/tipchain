"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, Loader2, Users, AlertCircle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCreatorMemberships,
  subscribeToTier,
  getMySubscriptions,
  type MembershipTierResponse,
} from "@/lib/api";

interface MembershipTierBrowserProps {
  creatorWallet: string;
  currentWallet: string;
}

export function MembershipTierBrowser({ creatorWallet, currentWallet }: MembershipTierBrowserProps) {
  const [tiers, setTiers] = useState<MembershipTierResponse[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [tiersData, subsData] = await Promise.all([
          getCreatorMemberships(creatorWallet),
          currentWallet ? getMySubscriptions(currentWallet).catch(() => ({ memberships: [] })) : Promise.resolve({ memberships: [] }),
        ]);
        setTiers(tiersData.tiers);
        setSubscriptions(subsData.memberships || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load memberships");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [creatorWallet, currentWallet]);

  const isSubscribed = (tierId: string) =>
    subscriptions.some((s: any) => s.tierId === tierId && s.status === "active");

  const handleSubscribe = async (tierId: string) => {
    if (!currentWallet) return;
    setSubscribing(tierId);
    setError(null);
    try {
      await subscribeToTier(tierId, currentWallet);
      const subsData = await getMySubscriptions(currentWallet);
      setSubscriptions(subsData.memberships || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscription failed");
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
        <div className="mb-4 flex items-center gap-2">
          <div className="size-5 rounded-lg bg-muted shimmer" />
          <div className="h-4 w-24 rounded-md bg-muted shimmer" />
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/50 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (tiers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card shadow-premium"
    >
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
          <Crown className="size-4 text-emerald-600" />
        </div>
        <h2 className="text-sm font-semibold">Membership Tiers</h2>
      </div>

      <div className="divide-y divide-border/50">
        {tiers.map((tier, i) => {
          const subscribed = isSubscribed(tier.id);
          const isSubscribing = subscribing === tier.id;
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group p-5 hover-glass-strong transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: tier.color || "#10b981" }}
                    />
                    <h3 className="text-sm font-semibold">{tier.name}</h3>
                    {tier.maxSubscribers && (
                      <span className="text-[10px] text-muted-foreground">
                        {tier.subscriberCount}/{tier.maxSubscribers} filled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{tier.description}</p>

                  {/* Token-gating badge */}
                  {tier.requiredToken && tier.requiredTokenSymbol && (
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-600">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      Requires {tier.requiredTokenAmount ? `${Number(tier.requiredTokenAmount).toLocaleString()} ` : ""}
                      {tier.requiredTokenSymbol}
                    </div>
                  )}

                  {tier.benefits && tier.benefits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tier.benefits.map((b, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/5 px-2 py-0.5 text-[10px] text-emerald-600 font-medium"
                        >
                          <Check className="size-2.5" /> {b}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-lg font-bold tracking-tight">
                    {tier.price} {tier.token || "SOL"}
                    <span className="text-xs font-normal text-muted-foreground">/month</span>
                  </p>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="shrink-0">
                  {subscribed ? (
                    <Button size="sm" className="gap-1.5 rounded-xl" disabled>
                      <Check className="size-3.5" /> Subscribed
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1.5 rounded-xl"
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={isSubscribing || !currentWallet}
                    >
                      {isSubscribing ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="size-3.5" />
                      )}
                      Subscribe
                    </Button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-5 mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </motion.div>
      )}
    </motion.div>
  );
}
