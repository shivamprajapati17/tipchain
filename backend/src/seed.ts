import { prisma } from "./lib/prisma";

// ─── Demo Data ──────────────────────────────────────────────────────────────
// Upsert-safe demo creators + sample tips for the live site.
// `npm run seed` upserts creators and seeds tips only if none exist yet.
// `npm run seed -- --clear` removes all demo data.

const CREATORS = [
  {
    walletAddress: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV",
    username: "solanagirl",
    bio: "Digital artist minting on Solana. Commission open!",
    socialLinks: JSON.stringify({ twitter: "https://x.com/solanagirl", instagram: "https://instagram.com/solanagirl" }),
  },
  {
    walletAddress: "wWy9bSic3RV6yYggcPadNBWAk4Mot4PeUJh4MQGigdNB",
    username: "cryptopod",
    bio: "Weekly deep dives into DeFi, NFTs and the Solana ecosystem.",
    socialLinks: JSON.stringify({ twitter: "https://x.com/cryptopod", youtube: "https://youtube.com/@cryptopod" }),
  },
  {
    walletAddress: "HSeJYTmcEw2XQpsRWGVGwAVcaAqhEGAGxjvN4v3Qfwoe",
    username: "codewithsam",
    bio: "Building open-source tools on Solana. Tip to support tutorials!",
    socialLinks: JSON.stringify({ github: "https://github.com/codewithsam" }),
  },
  {
    walletAddress: "Cr4T8wF2Nf3jMHjVz6Yuyg26pqN8L6thHuG78mDXHXsN",
    username: "musicbyria",
    bio: "Lo-fi beats producer. Every tip = new track.",
    socialLinks: JSON.stringify({ twitter: "https://x.com/musicbyria", spotify: "https://open.spotify.com/artist/ria" }),
  },
  {
    walletAddress: "remUrhAVawAU2YbRDPs6Thwy9iBuww61MzJQ7AjraryP",
    username: "devstream",
    bio: "Live-coding Solana dApps twice a week. Tips fund the stream setup!",
    socialLinks: JSON.stringify({ twitch: "https://twitch.tv/devstream", twitter: "https://x.com/devstream" }),
  },
  {
    walletAddress: "kkm5FQE57cShdWVNrvq9ysfQTvwVth9VgNdXGe9cPufb",
    username: "pixelpete",
    bio: "Pixel artist making NFT avatars and game sprites on Solana.",
    socialLinks: JSON.stringify({ twitter: "https://x.com/pixelpete" }),
  },
  {
    walletAddress: "xUsoyjr6f3eCiqohhbvVANAbHDLnEhDFkCccHJWUZa2w",
    username: "defidiva",
    bio: "Explaining DeFi strategies in plain language. No shill, just math.",
    socialLinks: JSON.stringify({ twitter: "https://x.com/defidiva", youtube: "https://youtube.com/@defidiva" }),
  },
  {
    walletAddress: "N9RyH7iBH7VqvEGBvJ37Y1bM9ujS9djRNbZbQoJqbukd",
    username: "tradertom",
    bio: "On-chain analyst. Daily market notes and wallet-watching threads.",
    socialLinks: JSON.stringify({ twitter: "https://x.com/tradertom" }),
  },
  {
    walletAddress: "UqUtJ6o1Qd6RmtWHLYJUjwLXTtkLLMSrkZ5etw8v6w2Z",
    username: "poetrypia",
    bio: "Minting poetry collections as compressed NFTs. Every tip mints a verse.",
    socialLinks: JSON.stringify({ twitter: "https://x.com/poetrypia" }),
  },
  {
    walletAddress: "qiVXMQ8S78KeA7T5LbpqnrZ21Jnp9qqs7PojZKPvhSQ4",
    username: "guildevan",
    bio: "Web3 gaming guild lead. Running weekly tournaments and raids.",
    socialLinks: JSON.stringify({ discord: "https://discord.gg/guildevan", twitter: "https://x.com/guildevan" }),
  },
  {
    walletAddress: "Cw7NYTvGbZtiQaemckzJh7FBkyTJ3Gos65QVowon2t6C",
    username: "photofinn",
    bio: "Street photographer selling prints as NFTs. Tip = new photo walk.",
    socialLinks: JSON.stringify({ instagram: "https://instagram.com/photofinn" }),
  },
  {
    walletAddress: "v7txX63v3YERPqtAHEf7Cfm6w99jeucdmEmhnNiVEFS5",
    username: "solfounder",
    bio: "Founder of a Solana infra startup. Writing about building in public.",
    socialLinks: JSON.stringify({ twitter: "https://x.com/solfounder", github: "https://github.com/solfounder" }),
  },
];

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
  { sender: "Cr4T8wF2Nf3jMHjVz6Yuyg26pqN8L6thHuG78mDXHXsN", receiver: "wWy9bSic3RV6yYggcPadNBWAk4Mot4PeUJh4MQGigdNB", amount: 3_000_000n, token: "USDC", message: "Keep the episodes coming 🎙️" },
  { sender: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV", receiver: "HSeJYTmcEw2XQpsRWGVGwAVcaAqhEGAGxjvN4v3Qfwoe", amount: 800_000_000n, token: "SOL", message: "Your Rust tutorials are incredible" },
  { sender: "wWy9bSic3RV6yYggcPadNBWAk4Mot4PeUJh4MQGigdNB", receiver: "HSeJYTmcEw2XQpsRWGVGwAVcaAqhEGAGxjvN4v3Qfwoe", amount: 2_000_000_000n, token: "SOL", message: null },
  { sender: "HSeJYTmcEw2XQpsRWGVGwAVcaAqhEGAGxjvN4v3Qfwoe", receiver: "Cr4T8wF2Nf3jMHjVz6Yuyg26pqN8L6thHuG78mDXHXsN", amount: 400_000_000n, token: "SOL", message: "This lo-fi mix is on repeat 🔥" },
  { sender: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV", receiver: "Cr4T8wF2Nf3jMHjVz6Yuyg26pqN8L6thHuG78mDXHXsN", amount: 1_500_000n, token: "USDC", message: "New album when? 👀" },
  { sender: "remUrhAVawAU2YbRDPs6Thwy9iBuww61MzJQ7AjraryP", receiver: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV", amount: 300_000_000n, token: "SOL", message: "Big fan of your generative art" },
  { sender: "kkm5FQE57cShdWVNrvq9ysfQTvwVth9VgNdXGe9cPufb", receiver: "remUrhAVawAU2YbRDPs6Thwy9iBuww61MzJQ7AjraryP", amount: 1_200_000_000n, token: "SOL", message: "Great stream today!" },
  { sender: "v7txX63v3YERPqtAHEf7Cfm6w99jeucdmEmhnNiVEFS5", receiver: "remUrhAVawAU2YbRDPs6Thwy9iBuww61MzJQ7AjraryP", amount: 500_000_000n, token: "SOL", message: "Your anchor tutorial saved me hours" },
  { sender: "xUsoyjr6f3eCiqohhbvVANAbHDLnEhDFkCccHJWUZa2w", receiver: "wWy9bSic3RV6yYggcPadNBWAk4Mot4PeUJh4MQGigdNB", amount: 2_500_000n, token: "USDC", message: "Amazing interview with the yield folks" },
  { sender: "N9RyH7iBH7VqvEGBvJ37Y1bM9ujS9djRNbZbQoJqbukd", receiver: "xUsoyjr6f3eCiqohhbvVANAbHDLnEhDFkCccHJWUZa2w", amount: 900_000_000n, token: "SOL", message: "Best DeFi explainer on the internet" },
  { sender: "wWy9bSic3RV6yYggcPadNBWAk4Mot4PeUJh4MQGigdNB", receiver: "xUsoyjr6f3eCiqohhbvVANAbHDLnEhDFkCccHJWUZa2w", amount: 1_500_000_000n, token: "SOL", message: "Collab soon?" },
  { sender: "UqUtJ6o1Qd6RmtWHLYJUjwLXTtkLLMSrkZ5etw8v6w2Z", receiver: "kkm5FQE57cShdWVNrvq9ysfQTvwVth9VgNdXGe9cPufb", amount: 200_000_000n, token: "SOL", message: "Love the sprite work" },
  { sender: "qiVXMQ8S78KeA7T5LbpqnrZ21Jnp9qqs7PojZKPvhSQ4", receiver: "N9RyH7iBH7VqvEGBvJ37Y1bM9ujS9djRNbZbQoJqbukd", amount: 750_000_000n, token: "SOL", message: "Your market notes are fire" },
  { sender: "Cw7NYTvGbZtiQaemckzJh7FBkyTJ3Gos65QVowon2t6C", receiver: "UqUtJ6o1Qd6RmtWHLYJUjwLXTtkLLMSrkZ5etw8v6w2Z", amount: 100_000_000n, token: "SOL", message: "This verse hit hard" },
  { sender: "v7txX63v3YERPqtAHEf7Cfm6w99jeucdmEmhnNiVEFS5", receiver: "qiVXMQ8S78KeA7T5LbpqnrZ21Jnp9qqs7PojZKPvhSQ4", amount: 2_200_000_000n, token: "SOL", message: "Raid was legendary" },
  { sender: "xUsoyjr6f3eCiqohhbvVANAbHDLnEhDFkCccHJWUZa2w", receiver: "Cw7NYTvGbZtiQaemckzJh7FBkyTJ3Gos65QVowon2t6C", amount: 350_000_000n, token: "SOL", message: "That neon alley shot 😍" },
  { sender: "kkm5FQE57cShdWVNrvq9ysfQTvwVth9VgNdXGe9cPufb", receiver: "v7txX63v3YERPqtAHEf7Cfm6w99jeucdmEmhnNiVEFS5", amount: 1_800_000_000n, token: "SOL", message: "Keep building in public" },
  { sender: "qBPFXbPikk8db1NEzo7RJvEZsaxzwfn42zpoW9vXG3AV", receiver: "Cw7NYTvGbZtiQaemckzJh7FBkyTJ3Gos65QVowon2t6C", amount: 600_000_000n, token: "SOL", message: "Prints are stunning" },
  { sender: "Cr4T8wF2Nf3jMHjVz6Yuyg26pqN8L6thHuG78mDXHXsN", receiver: "v7txX63v3YERPqtAHEf7Cfm6w99jeucdmEmhnNiVEFS5", amount: 4_000_000n, token: "USDC", message: "Thanks for the infra tips" },
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
    console.log("   (Run `npm run seed -- --clear` first to reseed from scratch)");
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
      const sol =
        tip.token === "SOL"
          ? (Number(tip.amount) / 1e9).toFixed(2)
          : (Number(tip.amount) / 1e6).toFixed(2);
      console.log(`   ✓ ${sol} ${tip.token} → @${username}`);
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
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });