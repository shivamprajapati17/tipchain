import { cn } from "./utils";

export interface PulseDotProps {
  className?: string;
}

export function PulseDot({ className }: PulseDotProps) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 bg-[#059669]",
        "animate-pulse",
        className
      )}
    />
  );
}
