import Link from "next/link";
import { Home, Compass, History, ArrowUpRight } from "lucide-react";

const EXPLORE_LINKS = [
  { href: "/creators", label: "Creators", icon: Compass, desc: "Find someone worth supporting" },
  { href: "/history", label: "Tip history", icon: History, desc: "Review your support" },
];

export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[110px]"
      />

      {/* Giant serif 404 */}
      <p
        className="text-[clamp(6rem,18vw,12rem)] font-semibold leading-none tracking-tight text-white/10 select-none"
        aria-hidden
        style={{ fontFamily: "Instrument Serif, serif" }}
      >
        404
      </p>

      <h1 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-white md:text-4xl">
        This page drifted{" "}
        <span className="serif-accent text-emerald-400">off-chain</span>
      </h1>

      <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
        The link you followed doesn&apos;t point to a live address. It may have
        been renamed, moved, or never minted. Let&apos;s get you back to solid
        ground.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-[0_0_32px_rgba(16,185,129,0.35)]"
        >
          <Home className="size-4 transition-transform group-hover:-translate-y-0.5" />
          Back to home
        </Link>
        <Link
          href="/creators"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <Compass className="size-4" />
          Explore creators
        </Link>
      </div>

      {/* Explore grid */}
      <div className="mt-16 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {EXPLORE_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3.5 text-left transition-all hover:border-white/10 hover:bg-white/[0.06]"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-transform group-hover:scale-110">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white">{link.label}</span>
                <span className="block truncate text-[11px] text-white/40">{link.desc}</span>
              </span>
              <ArrowUpRight className="size-3.5 shrink-0 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/60" />
            </Link>
          );
        })}
      </div>

      <p className="mt-10 font-mono text-[10px] uppercase tracking-widest text-white/25">
        TipChain — every path leads somewhere worth tipping
      </p>
    </main>
  );
}
