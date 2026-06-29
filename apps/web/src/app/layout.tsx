import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: "TIPCHAIN /// SUPPORT CREATORS DIRECTLY",
  description:
    "Decentralized creator tipping platform on Solana. No middlemen. No platform fees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexMono.variable} ${inter.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "IBM Plex Mono, monospace" }}
      >
        <Providers>
          <header className="fixed top-0 right-0 left-0 z-50 flex justify-center">
            <div
              className="mx-4 mt-2 border border-[#D4D4D0] bg-white"
              style={{ maxWidth: "min(90vw, 700px)", minWidth: "320px" }}
            >
              <div className="flex h-10 items-center justify-between px-3">
                {/* Logo — tactical unit marker */}
                <a href="/" className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-[#059669] tracking-[0.15em] font-bold">
                    [ T ]
                  </span>
                  <span className="text-[9px] text-[#888888] tracking-[0.1em] hidden sm:inline">
                    TIPCHAIN
                  </span>
                </a>

                {/* Navigation — ASCII bracketed */}
                <nav className="hidden sm:flex items-center gap-1">
                  <a
                    href="/"
                    className="px-2 py-1 text-[10px] tracking-[0.08em] text-[#888888] hover:text-[#111111] transition-colors"
                  >
                    [ HOME ]
                  </a>
                  <a
                    href="/creators"
                    className="px-2 py-1 text-[10px] tracking-[0.08em] text-[#888888] hover:text-[#111111] transition-colors"
                  >
                    [ EXPLORE ]
                  </a>
                  <a
                    href="/leaderboard"
                    className="px-2 py-1 text-[10px] tracking-[0.08em] text-[#888888] hover:text-[#111111] transition-colors"
                  >
                    [ LEADERBOARD ]
                  </a>
                  <a
                    href="/profile"
                    className="px-2 py-1 text-[10px] tracking-[0.08em] text-[#888888] hover:text-[#111111] transition-colors"
                  >
                    [ PROFILE ]
                  </a>
                  <a
                    href="/dashboard"
                    className="px-2 py-1 text-[10px] tracking-[0.08em] text-[#888888] hover:text-[#111111] transition-colors"
                  >
                    [ DASHBOARD ]
                  </a>
                  <span className="text-[10px] text-[#D4D4D0] select-none">|</span>
                  <a
                    href="/docs/sdk"
                    className="px-2 py-1 text-[10px] tracking-[0.08em] text-[#059669] hover:text-[#047857] transition-colors font-bold"
                  >
                    [ DOCS ]
                  </a>
                </nav>

                {/* Right side — Wallet placeholder */}
                <div className="flex items-center gap-1" id="wallet-slot">
                  <div className="h-6 w-24 border border-[#D4D4D0] bg-[#F9F9F7] flex items-center justify-center px-2">
                    <span className="text-[9px] tracking-[0.08em] text-[#888888]">
                      &lt; WALLET &gt;
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom green hazard stripe */}
              <div
                className="h-[2px]"
                style={{
                  background: "repeating-linear-gradient(90deg, #059669 0px, #059669 6px, transparent 6px, transparent 12px)",
                }}
              />
            </div>
          </header>

          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>

        {/* Paper grain overlay */}
        <div className="noise-fixed" />
      </body>
    </html>
  );
}
