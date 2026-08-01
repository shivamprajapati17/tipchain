"use client";

import { Gift, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useWalletSession } from "@solana/react-hooks";
import Link from "next/link";
import { motion } from "framer-motion";
import { trackReferralCode } from "@/lib/api";

export default function ReferRedirectPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code ?? "";
  const session = useWalletSession();
  const tracked = useRef(false);
  const [status, setStatus] = useState<"tracking" | "done" | "error">("tracking");

  useEffect(() => {
    if (!code || tracked.current) return;

    const track = (wallet?: string) => {
      if (tracked.current) return;
      tracked.current = true;

      const run = async () => {
        try {
          // Attribute the referral to the connected wallet so the referrer's
          // commission is computed from this user's future tips
          await trackReferralCode(code, wallet);
          setStatus("done");
          // Land the user on the creators page after a beat
          setTimeout(() => {
            window.location.href = "/creators";
          }, 2200);
        } catch {
          setStatus("error");
          // Don't auto-redirect on error so the message is legible
        }
      };
      run();
    };

    // If a wallet is already connected, track immediately with attribution.
    // Otherwise wait briefly for the user to connect (new users often connect
    // right after landing), then fall back to anonymous tracking so the
    // referral still registers. The `tracked` guard keeps this one-track-only.
    if (session?.account.address) {
      track(session.account.address);
      return;
    }
    const fallback = setTimeout(() => track(), 6000);
    return () => clearTimeout(fallback);
  }, [code, session?.account.address]);

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-premium">
          {status === "tracking" ? (
            <Loader2 className="size-7 text-amber-500 animate-spin" />
          ) : status === "done" ? (
            <CheckCircle2 className="size-7 text-emerald-500" />
          ) : (
            <AlertCircle className="size-7 text-amber-500" />
          )}
        </div>

        <h1 className="mb-2 text-xl font-semibold">
          {status === "tracking"
            ? "Verifying referral..."
            : status === "done"
              ? "Referral confirmed!"
              : "Referral not found"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
          {status === "tracking"
            ? `Tracking code "${code}" — you'll be redirected in a moment.`
            : status === "done"
              ? "Thanks for joining via a TipChain referral. Browse creators and send your first tip to earn the referrer commission."
              : `The referral code "${code}" doesn't match any active creator. You can still browse creators directly.`}
        </p>

        <Link
          href="/creators"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-muted/20 transition-colors"
        >
          <Gift className="size-3.5" />
          Browse Creators
          <ArrowRight className="size-3.5" />
        </Link>
      </motion.div>
    </div>
  );
}
