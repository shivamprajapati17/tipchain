import { prisma } from "./lib/prisma";

const MOCK_CREATORS = [
  {
    walletAddress: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    username: "rahul",
    bio: "Full-stack developer & Solana enthusiast. Building the future of web3.",
    avatarUrl: null,
  },
  {
    walletAddress: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE",
    username: "priya",
    bio: "Digital artist & NFT creator. Exploring the intersection of art and blockchain.",
    avatarUrl: null,
  },
  {
    walletAddress: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x",
    username: "arjun",
    bio: "Open source contributor & Rust developer. Building solana programs.",
    avatarUrl: null,
  },
];

const MOCK_TIPS = [
  {
    senderWallet: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE",
    receiverWallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    amount: BigInt(500_000_000), // 0.5 SOL
    token: "SOL",
    message: "Love your work!",
  },
  {
    senderWallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    receiverWallet: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE",
    amount: BigInt(10_000_000_000), // 10 USDC
    token: "USDC",
    message: "Keep creating amazing content!",
  },
  {
    senderWallet: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x",
    receiverWallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    amount: BigInt(250_000_000), // 0.25 SOL
    token: "SOL",
    message: null,
  },
  {
    senderWallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    receiverWallet: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x",
    amount: BigInt(1_000_000_000), // 1 SOL
    token: "SOL",
    message: "Keep building — great things ahead",
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.supporter.deleteMany();
  await prisma.creator.deleteMany();

  // Create creators
  for (const creator of MOCK_CREATORS) {
    await prisma.creator.create({ data: creator });
    console.log(`  ✓ Creator: ${creator.username}`);
  }

  // Create transactions (which also creates supporter records)
  for (const tip of MOCK_TIPS) {
    const tx = await prisma.transaction.create({
      data: tip,
    });

    // Upsert supporter
    await prisma.supporter.upsert({
      where: {
        walletAddress_creatorWallet: {
          walletAddress: tip.senderWallet,
          creatorWallet: tip.receiverWallet,
        },
      },
      update: {
        totalTipped: { increment: tip.amount },
        tipCount: { increment: 1 },
      },
      create: {
        walletAddress: tip.senderWallet,
        creatorWallet: tip.receiverWallet,
        totalTipped: tip.amount,
        tipCount: 1,
      },
    });

    // Update creator stats
    await prisma.creator.update({
      where: { walletAddress: tip.receiverWallet },
      data: {
        totalTips: { increment: tip.amount },
      },
    });

    console.log(`  ✓ Tip: ${tip.amount.toString()} ${tip.token}`);
  }

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
