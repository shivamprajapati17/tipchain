import { prisma } from "./lib/prisma";

// ─── Demo Data ──────────────────────────────────────────────────────────────
// Matches the creators currently live on the site (same wallet addresses, so
// tips recorded on-chain stay consistent). `npm run db:seed` upserts these;
// `npm run db:seed -- --clear` removes all demo data instead.

const CREATORS = [
  {
    walletAddress: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV",
    username: "solanagirl",
    bio: "Digital artist minting on Solana. Commission open!",
    socialLinks: JSON.stringify({
      twitter: "https://x.com/solanagirl",
      instagram: "https://instagram.com/solanagirl",
    }),
  },
  {
    walletAddress: "wWy9bSic3RV6yYggcPadNBWAk4Mot4PeUJh4MQGigdNB",
    username: "cryptopod",
    bio: "Weekly deep dives into DeFi, NFTs and the Solana ecosystem.",
    socialLinks: JSON.stringify({
      twitter: "https://x.com/cryptopod",
      youtube: "https://youtube.com/@cryptopod",
    }),
  },
  {
    walletAddress: "HSeJYTmcEw2XQpsRWGVGwAVcaAqhEGAGxjvN4v3Qfwoe",
    username: "codewithsam",
    bio: "Building open-source tools on Solana. Tip to support tutorials!",
    socialLinks: JSON.stringify({
      github: "https://github.com/codewithsam",
    }),
  },
  {
    walletAddress: "Cr4T8wF2Nf3jMHjVz6Yuyg26pqN8L6thHuG78mDXHXsN",
    username: "musicbyria",
    bio: "Lo-fi beats producer. Every tip = new track.",
    socialLinks: JSON.stringify({
      twitter: "https://x.com/musicbyria",
      spotify: "https://open.spotify.com/artist/ria",
    }),
  },
];

// sender -> receiver tips (amounts in lamports). 1 SOL = 1_000_000_000 lamports.
const TIPS: {
  sender: string;
  receiver: string;
  amount: bigint;
  token: string;
  message: string | null;
}[] = [
  { sender: "wWy9bSic3RV6yYggcPadNBWAk4Mot4PeUJh4MQGigdNB", receiver: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV", amount: 500_000_000n, token: "SOL", message: "Love your art style! 🎨" },
  { sender: "HSeJYTmcEw2XQpsRWGVGwAVcaAqhEGAGxjvN4v3Qfwoe", receiver: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV", amount: 250_000_000n, token: "SOL", message: "Commission sent, check DMs!" },
  { sender: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV", receiver: "wWy9bSic3RV6yYggcPadNBWAk4Mot4PeUJh4MQGigdNB", amount: 1_000_000_000n, token: "SOL", message: "Best crypto podcast out there" },
  { sender: "Cr4T8wF2Nf3jMHjVz6Yuyg26pqN8L6thHuG78mDXHXsN", receiver: "wWy9bSic3RV6yYggcPadNBWAk4Mot4PeUJh4MQGigdNB", amount: 3_000_000_000n, token: "USDC", message: "Keep the episodes coming 🎙️" },
  { sender: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV", receiver: "HSeJYTmcEw2XQpsRWGVGwAVcaAqhEGAGxjvN4v3Qfwoe", amount: 800_000_000n, token: "SOL", message: "Your Rust tutorials are incredible" },
  { sender: "wWy9bSic3RV6yYggcPadNBWAk4Mot4PeUJh4MQGigdNB", receiver: "HSeJYTmcEw2XQpsRWGVGwAVcaAqhEGAGxjvN4v3Qfwoe", amount: 2_000_000_000n, token: "SOL", message: null },
  { sender: "HSeJYTmcEw2XQpsRWGVGwAVcaAqhEGAGxjvN4v3Qfwoe", receiver: "Cr4T8wF2Nf3jMHjVz6Yuyg26pqN8L6thHuG78mDXHXsN", amount: 400_000_000n, token: "SOL", message: "This lo-fi mix is on repeat 🔥" },
  { sender: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV", receiver: "Cr4T8wF2Nf3jMHjVz6Yuyg26pqN8L6thHuG78mDXHXsN", amount: 1_500_000_000n, token: "USDC", message: "New album when? 👀" },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const shouldClear = process.argv.includes("--clear");

  if (shouldClear) {
    console.log("🧹 Clearing demo data...");
    await prisma.transaction.deleteMany();
    await prisma.supporter.deleteMany();
    await prisma.creator.deleteMany();
    console.log("   Done");
    return;
  }

  console.log("🌱 Seeding TipChain database...\n");

  // ── Creators (upsert — safe to re-run, keeps live profiles) ─────────────
  console.log("📝 Upserting creators...");
  for (const creator of CREATORS) {
    const links = JSON.parse(creator.socialLinks);
    const uniqueSupporters = new Set(
      TIPS.filter((t) => t.receiver === creator.walletAddress).map((t) => t.sender)
    );
    const supporterCount = uniqueSupporters.size;
    const totalTips = TIPS.filter((t) => t.receiver === creator.walletAddress).reduce(
      (sum, t) => sum + t.amount,
      0n
    );

    await prisma.creator.upsert({
      where: { walletAddress: creator.walletAddress },
      update: {
        username: creator.username,
        bio: creator.bio,
        socialLinks: JSON.stringify(links),
        totalTips,
        supporterCount,
      },
      create: {
        ...creator,
        socialLinks: JSON.stringify(links),
        totalTips,
        supporterCount,
      },
    });
    console.log(`   ✓ @${creator.username}`);
  }
  console.log("");

  // ── Transactions & Supporters ─────────────────────────────────────────
  console.log("💰 Seeding transactions...");
  const existing = await prisma.transaction.count();
  if (existing > 0) {
    console.log(`   ${existing} transactions already exist — skipping to avoid duplicates`);
    console.log("   (Run `npm run db:seed -- --clear` first to reseed from scratch)");
  } else {
    for (let i = 0; i < TIPS.length; i++) {
      const tip = TIPS[i];
      await prisma.transaction.create({
        data: {
          senderWallet: tip.sender,
          receiverWallet: tip.receiver,
          amount: tip.amount,
          token: tip.token,
          message: tip.message,
          createdAt: new Date(Date.now() - (TIPS.length - i) * 86400000),
        },
      });

      await prisma.supporter.upsert({
        where: {
          walletAddress_creatorWallet: {
            walletAddress: tip.sender,
            creatorWallet: tip.receiver,
          },
        },
        update: {
          totalTipped: { increment: tip.amount },
          tipCount: { increment: 1 },
        },
        create: {
          walletAddress: tip.sender,
          creatorWallet: tip.receiver,
          totalTipped: tip.amount,
          tipCount: 1,
        },
      });

      const username =
        CREATORS.find((c) => c.walletAddress === tip.receiver)?.username ?? tip.receiver;
      console.log(`   ✓ ${(Number(tip.amount) / 1e9).toFixed(2)} ${tip.token} → @${username}`);
    }
  }
  console.log("");

  // ── Stats Summary ─────────────────────────────────────────────────────
  console.log("📊 Summary:");
  const creatorCount = await prisma.creator.count();
  const txCount = await prisma.transaction.count();
  const supporterCount = await prisma.supporter.count();

  console.log(`   ${creatorCount} creators`);
  console.log(`   ${txCount} transactions`);
  console.log(`   ${supporterCount} supporter relationships`);

  console.log("\n✅ Seeding complete!");
  console.log("   Verify: curl https://tipchain-backend.vercel.app/api/v1/creators");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });