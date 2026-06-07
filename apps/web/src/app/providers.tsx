"use client";

import { type ReactNode } from "react";
import { SolanaProvider } from "@solana/react-hooks";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SolanaProvider
      config={{
        cluster: "devnet",
        rpc: "https://api.devnet.solana.com",
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
