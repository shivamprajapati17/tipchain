"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { SolanaProvider } from "@solana/react-hooks";
import {
  createWalletStandardConnector,
  defaultWalletConnectors,
  type WalletConnector,
} from "@solana/client";
import {
  getDefaultTransport,
  getMultichainClient,
  isMetamaskInstalled,
} from "@metamask/multichain-api-client";
import { getWalletStandard } from "@metamask/solana-wallet-standard";

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

const rpcEndpoint = HELIUS_API_KEY
  ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : "https://api.devnet.solana.com";

// The base connector list is a static snapshot (phantom/solflare/backpack +
// wallet-standard discovery). Compute it once so the provider config identity
// stays stable and the Solana client is not recreated on every render.
let baseConnectorsCache: readonly WalletConnector[] | null = null;
function getBaseConnectors(): readonly WalletConnector[] {
  if (!baseConnectorsCache) {
    baseConnectorsCache = defaultWalletConnectors();
  }
  return baseConnectorsCache;
}

/**
 * Builds a connector for MetaMask using MetaMask's official Solana Wallet Snap
 * (wallet-standard integration). Returns null when the SDK cannot initialize
 * (e.g. the extension is missing or an unsupported environment).
 */
function createMetaMaskConnector(): WalletConnector | null {
  try {
    const client = getMultichainClient({ transport: getDefaultTransport() });
    const metamaskWallet = getWalletStandard({
      client,
      walletName: "MetaMask",
    });
    return createWalletStandardConnector(metamaskWallet, {
      id: "wallet-standard:metamask",
      name: "MetaMask",
      kind: "wallet-standard",
      canAutoConnect: false,
    });
  } catch {
    return null;
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [metaMaskConnector, setMetaMaskConnector] =
    useState<WalletConnector | null>(null);

  // Detect the MetaMask extension asynchronously (EIP-6963 announcement) and,
  // when present, register its Solana Snap connector so "MetaMask" shows up in
  // the wallet dropdown alongside Phantom, Solflare, Backpack, and friends.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const installed = await isMetamaskInstalled();
        if (!installed || cancelled) return;
        const connector = createMetaMaskConnector();
        if (connector && !cancelled) {
          setMetaMaskConnector(connector);
        }
      } catch {
        // MetaMask SDK unavailable in this environment — fall back to the
        // default wallet list.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const config = useMemo(() => {
    const base = getBaseConnectors();
    // Avoid a duplicate entry if the MetaMask extension already registers its
    // own wallet-standard wallet (newer MetaMask versions auto-register).
    const alreadyListed = base.some((c) =>
      c.name.toLowerCase().includes("metamask")
    );
    const walletConnectors =
      metaMaskConnector && !alreadyListed
        ? [...base, metaMaskConnector]
        : base;
    return {
      cluster: "devnet" as const,
      rpc: rpcEndpoint,
      walletConnectors,
    };
  }, [metaMaskConnector]);

  return (
    <SolanaProvider
      config={config}
      walletPersistence={{
        autoConnect: true,
        storageKey: "tipchain:wallet",
      }}
    >
      {children}
    </SolanaProvider>
  );
}
