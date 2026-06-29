"use client";

import { type ReactNode } from "react";
import { SolanaProvider } from "@solana/react-hooks";

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

const rpcEndpoint = HELIUS_API_KEY
  ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : "https://api.devnet.solana.com";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SolanaProvider
      config={{
        cluster: "devnet",
        rpc: rpcEndpoint,
      }}
      walletPersistence={{
        autoConnect: true,
        storageKey: "tipchain:wallet",
      }}
    >
      {children}
    </SolanaProvider>
  );
}
