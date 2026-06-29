import { cn } from "./utils";

export interface WalletAddressProps {
  address: string;
  chars?: number;
  className?: string;
}

export function WalletAddress({ address, chars = 4, className }: WalletAddressProps) {
  if (!address || address.length <= chars * 2) {
    return <span className={cn("font-mono text-xs", className)}>{address}</span>;
  }

  return (
    <span className={cn("font-mono text-xs", className)}>
      {address.slice(0, chars * 2)}...{address.slice(-chars)}
    </span>
  );
}
