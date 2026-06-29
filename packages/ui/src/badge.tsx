import { cn } from "./utils";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 font-medium tracking-[0.08em] uppercase border",
        size === "sm" && "text-[10px]",
        size === "md" && "text-xs",
        variant === "default" && "border-[#059669] bg-[#F0FDF4] text-[#059669]",
        variant === "success" && "border-[#059669] bg-[#F0FDF4] text-[#059669]",
        variant === "warning" && "border-[#F59E0B] bg-[#FFFBEB] text-[#F59E0B]",
        variant === "destructive" && "border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]",
        variant === "outline" && "border-[#D4D4D0] bg-white text-[#888888]",
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "inline-block size-1.5",
            variant === "default" && "bg-[#059669]",
            variant === "success" && "bg-[#059669]",
            variant === "warning" && "bg-[#F59E0B]",
            variant === "destructive" && "bg-[#DC2626]",
            variant === "outline" && "bg-[#888888]"
          )}
        />
      )}
      {children}
    </span>
  );
}
