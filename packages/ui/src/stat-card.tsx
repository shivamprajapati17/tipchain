import { cn } from "./utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "border border-[#D4D4D0] bg-white p-5",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <div className="size-9 flex items-center justify-center border border-[#D4D4D0] bg-[#F9F9F7]">
            {icon}
          </div>
        )}
        {trend && (
          <span
            className={cn(
              "text-xs font-bold tracking-[0.08em]",
              trend === "up" && "text-[#059669]",
              trend === "down" && "text-[#059669]",
              trend === "neutral" && "text-[#888888]"
            )}
          >
            {trend === "up" && ">>"}
            {trend === "down" && "<<"}
            {trend === "neutral" && "——"}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight text-[#111111]">{value}</p>
      <p className="text-[10px] tracking-[0.1em] text-[#9CA3AF] mt-1 uppercase">{label}</p>
    </div>
  );
}
