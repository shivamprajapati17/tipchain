"use client";

import { memo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Loader2, AlertCircle } from "lucide-react";
import {
  getRevenueData,
  lamportsToSol,
  type RevenueDataPoint,
} from "@/lib/api";

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
        {Number(payload[0].value).toFixed(4)} SOL
      </p>
      <p className="text-[11px] text-muted-foreground">
        {payload[1]?.value} transactions
      </p>
    </div>
  );
}

// ─── Revenue Chart Component ────────────────────────────────────────────────

export const RevenueChart = memo(function RevenueChart({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await getRevenueData(walletAddress, 30);
        if (mounted) setData(result.revenue ?? []);
      } catch (err) {
        if (mounted)
          setError(
            err instanceof Error ? err.message : "Failed to load revenue data"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [walletAddress]);

  // Transform data for Recharts
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    amount: lamportsToSol(d.amount),
    count: d.count,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }}
      className="rounded-2xl border border-border bg-card shadow-premium"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <TrendingUp className="size-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-semibold">Revenue (30 days)</h2>
        </div>
        {!loading && !error && (
          <span className="text-[10px] text-muted-foreground">
            {chartData.length > 0
              ? `${chartData[chartData.length - 1]?.date} — ${chartData[0]?.date}`
              : "No data"}
          </span>
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
        ) : chartData.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center">
            <p className="text-xs text-muted-foreground/40">
              No revenue data yet
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.45 0.12 160)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.45 0.12 160)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.87 0 0 / 0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "oklch(0.55 0 0)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "oklch(0.55 0 0)" }}
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(v: number) => `${v.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="oklch(0.45 0.12 160)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "oklch(0.45 0.12 160)",
                  stroke: "white",
                  strokeWidth: 2,
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="oklch(0.65 0.08 220)"
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
                strokeDasharray="4 4"
                hide
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
});
