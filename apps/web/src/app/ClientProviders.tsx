"use client";

import { type ReactNode } from "react";
import dynamic from "next/dynamic";

// Lazy-load the Solana wallet provider tree so the heavy @solana packages
// (~600KB) don't block the initial page paint.
const Providers = dynamic(() => import("./providers").then((m) => m.Providers), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-center">
        <div className="mx-auto mb-4 size-10 rounded-xl bg-emerald-500/10 animate-pulse" />
        <p className="text-xs text-white/30">Loading TipChain...</p>
      </div>
    </div>
  ),
});

export function ClientProviders({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
