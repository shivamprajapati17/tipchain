"use client";

import { memo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { Coins, Loader2, AlertCircle } from "lucide-react";
import { getTipAnalytics, lamportsToSol } from "@/lib/api";

// ─── Colors ─────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "oklch(0.45 0.12 160)",
  "oklch(0.55 0.14 170)",
  "oklch(0.65 0.12 180)",
  "oklch(0.72 0.08 190)",
  "oklch(0.78 0.05 200)",
];

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card/95 px-4 py-3 shadow-premium-lg backdrop-blur-md">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-bold text-emerald-600">
        {lamportsToSol(payload[0].value).toFixed(4)} SOL
      </p>
      <p className="text-[11px] text-muted-foreground">
        {payload[1]?.value} transactions
      </p>
    </div>
  );
}

// ─── Tip Analytics Component ────────────────────────────────────────────────

export const TipAnalyticsChart = memo(function TipAnalyticsChart({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    let mounted = true;

    async function fetch() {
      try {
        setLoading(true);
        setError(null);
        const result = await getTipAnalytics(walletAddress);
        if (mounted) setData(result);
      } catch (err) {
        if (mounted)
          setError(
            err instanceof Error ? err.message : "Failed to load tip analytics"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetch();
    return () => {
      mounted = false;
    };
  }, [walletAddress]);

  // Prepare token breakdown for chart
  const tokenData =
    data?.tokenBreakdown?.map((t: any, i: number) => ({
      name: t.token,
      amount: lamportsToSol(t.total),
      count: t.count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    })) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.2 }}
      className="rounded-2xl border border-border bg-card shadow-premium"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <Coins className="size-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-semibold">Token Breakdown</h2>
        </div>
        {!loading && data && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>
              Avg:{" "}
              <span className="font-medium text-foreground">
                {lamportsToSol(data.averageTip).toFixed(4)} SOL
              </span>
            </span>
            <span>
              Largest:{" "}
              <span className="font-medium text-foreground">
                {lamportsToSol(data.largestTip).toFixed(4)} SOL
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="p-4">
        {loading ? (
          <div className="flex h-[220px] items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : error ? (
          <div className="flex h-[220px] flex-col items-center justify-center gap-2">
            <AlertCircle className="size-5 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/60">{error}</p>
          </div>
        ) : tokenData.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center">
            <p className="text-xs text-muted-foreground/40">
              No transaction data yet
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tokenData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.87 0 0 / 0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "oklch(0.55 0 0)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "oklch(0.55 0 0)" }}
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(v: number) => `${v.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="amount"
                radius={[6, 6, 0, 0]}
                maxBarSize={80}
              >
                {tokenData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Summary stats */}
        {!loading && data && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
            <div className="rounded-lg bg-muted/20 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Total Tips</p>
              <p className="text-sm font-semibold">{data.totalTips}</p>
            </div>
            <div className="rounded-lg bg-muted/20 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Total Volume</p>
              <p className="text-sm font-semibold">
                {tokenData.reduce((s: number, t: any) => s + t.amount, 0).toFixed(4)} SOL
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
