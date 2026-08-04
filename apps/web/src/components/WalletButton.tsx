"use client";

import { useWalletConnection, useBalance } from "@solana/react-hooks";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ChevronDown, Loader2, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

const INSTALL_LINKS = [
  { name: "Phantom", href: "https://phantom.app" },
  { name: "Solflare", href: "https://solflare.com" },
  { name: "Backpack", href: "https://backpack.app" },
  { name: "Coinbase Wallet", href: "https://www.coinbase.com/wallet" },
];

function isMetaMaskInstalled() {
  if (typeof window === "undefined") return false;
  const eth = (window as Window & { ethereum?: { isMetaMask?: boolean } })
    .ethereum;
  return Boolean(eth?.isMetaMask);
}

function friendlyConnectError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const m = message.toLowerCase();
  if (m.includes("metamask") || m.includes("snap") || m.includes("solana")) {
    return "MetaMask connects through its Solana account. Approve the Solana setup prompt in MetaMask, then try again.";
  }
  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network error") ||
    m.includes("load failed")
  ) {
    return "Network error — check your connection and try again.";
  }
  if (
    m.includes("rejected") ||
    m.includes("denied") ||
    m.includes("cancelled") ||
    m.includes("canceled")
  ) {
    return "Connection request was rejected. Approve it in your wallet to connect.";
  }
  return message;
}

export function WalletButton() {
  const {
    connect,
    disconnect,
    connectors,
    connected,
    connecting,
    wallet,
    status,
    error,
    isReady,
  } = useWalletConnection();

  // Show the connected wallet's SOL balance in the dropdown.
  const balance = useBalance(wallet?.account.address);
  const solBalance = Number(balance.lamports ?? 0) / 1e9;

  const [isOpen, setIsOpen] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isReady) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Loader2 className="size-4 animate-spin" />
        Initializing...
      </Button>
    );
  }

  if (connecting) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Loader2 className="size-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (connected && wallet) {
    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Wallet className="size-4" />
          <span className="font-mono text-xs">
            {truncateAddress(wallet.account.address)}
          </span>
          <ChevronDown className="size-3 opacity-50" />
        </Button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Connected with {wallet.connector.name ?? "Wallet"}
            </div>
            <div className="px-3 pb-2 font-mono text-xs text-foreground break-all">
              {wallet.account.address}
            </div>
            <div className="mx-2 mb-2 flex items-center justify-between rounded-md bg-emerald-500/10 px-3 py-2">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="font-mono text-xs font-semibold text-emerald-400">
                {solBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL
              </span>
            </div>
            <div className="border-t border-border pt-1">
              <button
                onClick={() => {
                  disconnect();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="size-4" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Wallet className="size-4" />
        Connect Wallet
        <ChevronDown className="size-3 opacity-70" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-border bg-popover p-1 shadow-lg z-50">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
            Select a wallet
          </div>

          {connectError && (
            <div className="mx-2 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {connectError}
            </div>
          )}

          {connectors.length === 0 ? (
            <div className="px-3 py-3">
              <div className="px-1 pb-2 text-center text-sm text-muted-foreground">
                No wallet extensions detected. Install one to get started.
              </div>
              <div className="space-y-1">
                {INSTALL_LINKS.map((w) => (
                  <a
                    key={w.name}
                    href={w.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent transition-colors"
                  >
                    <span>{w.name}</span>
                    <ExternalLink className="size-3.5 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={async () => {
                    setConnectError(null);
                    try {
                      await connect(connector.id);
                      setIsOpen(false);
                    } catch (err) {
                      setConnectError(friendlyConnectError(err));
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  {connector.icon ? (
                    <img
                      src={connector.icon}
                      alt={connector.name}
                      className="size-6 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const fallback =
                          (e.target as HTMLImageElement)
                            .nextElementSibling;
                        if (fallback) {
                          (fallback as HTMLElement).style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="hidden size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  >
                    {connector.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{connector.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isMetaMaskInstalled() && (
            <div className="mx-2 mt-2 rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-[10px] leading-relaxed text-blue-700 dark:text-blue-300">
              Tip: MetaMask connects with a Solana account — the first connect
              will ask you to add Solana to MetaMask.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
