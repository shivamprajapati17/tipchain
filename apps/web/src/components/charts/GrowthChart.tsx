"use client";

import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import {
  TrendingUp,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { getGrowthMetrics, lamportsToSol } from "@/lib/api";

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
      <p className="mb-1 text-xs font-medium">{label}</p>
      <p className="text-sm font-bold text-emerald-600">
        {lamportsToSol(payload[0].value).toFixed(4)} SOL
      </p>
    </div>
  );
}

// ─── Growth Chart Component ─────────────────────────────────────────────────

export const GrowthChart = memo(function GrowthChart({
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
        const result = await getGrowthMetrics(walletAddress);
        if (mounted) setData(result);
      } catch (err) {
        if (mounted)
          setError(
            err instanceof Error ? err.message : "Failed to load growth data"
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

  // Prepare month comparison data
  const comparisonData = data
    ? [
        {
          name: "Previous",
          revenue: lamportsToSol(data.previousMonthRevenue),
          transactions: data.previousMonthTransactions,
        },
        {
          name: "Current",
          revenue: lamportsToSol(data.currentMonthRevenue),
          transactions: data.currentMonthTransactions,
        },
      ]
    : [];

  const growthPercent = data?.revenueGrowthPercent ?? 0;
  const isPositive = growthPercent > 0;
  const isNeutral = growthPercent === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 }}
      className="rounded-2xl border border-border bg-card shadow-premium"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <TrendingUp className="size-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-semibold">Month-over-Month</h2>
        </div>
        {!loading && data && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-600"
                : isNeutral
                  ? "bg-zinc-500/10 text-zinc-500"
                  : "bg-red-500/10 text-red-600"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="size-3" />
            ) : isNeutral ? (
              <Minus className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(growthPercent).toFixed(1)}%
          </motion.div>
        )}
      </div>

      {/* Chart Area */}
      <div className="p-4">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : error ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2">
            <AlertCircle className="size-5 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/60">{error}</p>
          </div>
        ) : !data ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-xs text-muted-foreground/40">No growth data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonData} barCategoryGap="30%">
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
                dataKey="revenue"
                radius={[6, 6, 0, 0]}
                maxBarSize={120}
              >
                {comparisonData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === 1
                        ? "oklch(0.45 0.12 160)"
                        : "oklch(0.65 0 0 / 0.2)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Stats row */}
        {!loading && data && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
            <div className="rounded-lg bg-muted/20 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Current Month TX</p>
              <p className="text-sm font-semibold">
                {data.currentMonthTransactions}
              </p>
            </div>
            <div className="rounded-lg bg-muted/20 px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Previous Month TX</p>
              <p className="text-sm font-semibold">
                {data.previousMonthTransactions}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
