import { prisma } from "./lib/prisma";

// ─── Mock Data ──────────────────────────────────────────────────────────────

const CREATORS = [
  {
    walletAddress: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    username: "rahul",
    bio: "Full-stack developer & Solana enthusiast. Building the future of web3.",
    socialLinks: JSON.stringify({
      twitter: "https://x.com/rahul_dev",
      github: "https://github.com/rahuldev",
      website: "https://rahuldev.xyz",
    }),
  },
  {
    walletAddress: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE",
    username: "priya",
    bio: "Digital artist & NFT creator. Pushing the boundaries of generative art on Solana.",
    socialLinks: JSON.stringify({
      twitter: "https://x.com/priya_art",
      instagram: "https://instagram.com/priya_art",
    }),
  },
  {
    walletAddress: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x",
    username: "arjun",
    bio: "Open source contributor & Rust developer. Building Solana programs and developer tooling.",
    socialLinks: JSON.stringify({
      twitter: "https://x.com/arjun_builds",
      github: "https://github.com/arjunbuilds",
    }),
  },
  {
    walletAddress: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd",
    username: "shivam",
    bio: "hi",
    socialLinks: JSON.stringify({
      twitter: "https://x.com/Shivampra17",
    }),
  },
];

const TIPS = [
  { sender: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE", receiver: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", amount: 500_000_000n, token: "SOL", message: "Love your work! Keep building 🚀" },
  { sender: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", receiver: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE", amount: 10_000_000_000n, token: "USDC", message: "Keep creating amazing content!" },
  { sender: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x", receiver: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", amount: 250_000_000n, token: "SOL", message: null },
  { sender: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", receiver: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x", amount: 1_000_000_000n, token: "SOL", message: "Keep building — great things ahead" },
  { sender: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE", receiver: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x", amount: 3_000_000_000n, token: "SOL", message: "Your Rust tutorials are incredible!" },
  { sender: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x", receiver: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE", amount: 500_000_000n, token: "SOL", message: "This NFT collection is fire 🔥" },
  { sender: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd", receiver: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", amount: 150_000_000n, token: "SOL", message: "Great content!" },
  { sender: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd", receiver: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE", amount: 2_500_000_000n, token: "USDC", message: "Love the art style!" },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding TipChain database...\n");

  // Clean existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.transaction.deleteMany();
  await prisma.supporter.deleteMany();
  await prisma.creator.deleteMany();
  console.log("   Done\n");

  // ── Creators ──────────────────────────────────────────────────────────
  console.log("📝 Creating creators...");
  for (const creator of CREATORS) {
    const links = JSON.parse(creator.socialLinks);
    const uniqueSupporters = new Set(
      TIPS.filter((t) => t.receiver === creator.walletAddress).map((t) => t.sender)
    );
    const supporterCount = uniqueSupporters.size;

    const totalTips = TIPS
      .filter((t) => t.receiver === creator.walletAddress)
      .reduce((sum, t) => sum + t.amount, 0n);

    await prisma.creator.create({
      data: {
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
  console.log("💰 Creating transactions...");
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

    await prisma.creator.update({
      where: { walletAddress: tip.receiver },
      data: {
        totalTips: { increment: tip.amount },
      },
    });

    console.log(`   ✓ ${(Number(tip.amount) / 1e9).toFixed(2)} ${tip.token} → @${CREATORS.find((c) => c.walletAddress === tip.receiver)?.username}`);
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
  console.log("   Run `curl http://localhost:4000/api/v1/creators` to verify.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
