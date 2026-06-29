import { cn } from "./utils";

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "circle";
}

export function Skeleton({ className, variant = "text" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-[#F0F0EC] animate-pulse",
        variant === "text" && "h-4 w-full",
        variant === "card" && "border border-[#D4D4D0]",
        variant === "circle" && "size-10",
        className
      )}
    />
  );
}
