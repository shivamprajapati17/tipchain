"use client";

import { type ReactNode, useMemo } from "react";
import { SolanaProvider } from "@solana/react-hooks";
import {
  defaultWalletConnectors,
} from "@solana/client";

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

const rpcEndpoint = HELIUS_API_KEY
  ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : "https://api.devnet.solana.com";

// Build connectors once at module scope so the config never changes.
// defaultWalletConnectors() discovers Phantom, Solflare, Backpack, and any
// wallet-standard wallets (including MetaMask Solana Snap if installed).
const walletConnectors = defaultWalletConnectors();

const config = {
  cluster: "devnet" as const,
  rpc: rpcEndpoint,
  walletConnectors,
};

// Memoize walletPersistence outside the component to keep reference stable
const walletPersistence = {
  autoConnect: true,
  storageKey: "tipchain:wallet",
};

export function Providers({ children }: { children: ReactNode }) {
  // No useMemo needed — config and walletPersistence are both stable module-level
  // references that never change. This prevents SolanaProvider from reinitializing
  // on navigation, which was causing the wallet to disconnect.

  return (
    <SolanaProvider
      config={config}
      walletPersistence={walletPersistence}
    >
      {children}
    </SolanaProvider>
  );
}
