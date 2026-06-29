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
      _referrals: [],
      _referral_uses: [],
    }),
  },
  {
    walletAddress: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE",
    username: "priya",
    bio: "Digital artist & NFT creator. Pushing the boundaries of generative art on Solana.",
    socialLinks: JSON.stringify({
      twitter: "https://x.com/priya_art",
      instagram: "https://instagram.com/priya_art",
      _referrals: [],
      _referral_uses: [],
    }),
  },
  {
    walletAddress: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x",
    username: "arjun",
    bio: "Open source contributor & Rust developer. Building Solana programs and developer tooling.",
    socialLinks: JSON.stringify({
      twitter: "https://x.com/arjun_builds",
      github: "https://github.com/arjunbuilds",
      _referrals: [],
      _referral_uses: [],
    }),
  },
  {
    walletAddress: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd",
    username: "shivam",
    bio: "hi",
    socialLinks: JSON.stringify({
      twitter: "https://x.com/Shivampra17",
      _referrals: [],
      _referral_uses: [],
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

const REFERRAL_CODES = [
  { code: "RAHUL-A1B2", creatorWallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", useCount: 3 },
  { code: "PRIYA-C3D4", creatorWallet: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE", useCount: 1 },
];

const REFERRAL_USES = [
  { code: "RAHUL-A1B2", wallet: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd", usedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { code: "RAHUL-A1B2", wallet: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x", usedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { code: "RAHUL-A1B2", wallet: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE", usedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { code: "PRIYA-C3D4", wallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", usedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

const MEMBERSHIP_TIERS = [
  {
    id: "tier_member",
    creatorWallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    name: "Member",
    description: "Support Rahul's work and get exclusive behind-the-scenes updates.",
    priceSol: "100000000", // 0.1 SOL
    priceUsd: 14.5,
    benefits: ["Exclusive updates", "Discord role", "Early access to projects"],
    color: "#10b981",
    maxSubscribers: null,
    isActive: true,
    subscriberCount: 2,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "tier_pro",
    creatorWallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    name: "Pro Supporter",
    description: "Get premium access to code reviews, 1-on-1 calls, and early beta access.",
    priceSol: "500000000", // 0.5 SOL
    priceUsd: 72.5,
    benefits: ["Everything in Member", "Monthly 1-on-1 call", "Code review sessions", "Beta access"],
    color: "#8b5cf6",
    maxSubscribers: 10,
    isActive: true,
    subscriberCount: 1,
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: "tier_supporter",
    creatorWallet: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE",
    name: "Art Supporter",
    description: "Support Priya's art journey and get exclusive NFT drops.",
    priceSol: "200000000", // 0.2 SOL
    priceUsd: 29,
    benefits: ["Monthly art prints", "Exclusive NFT airdrops", "Behind-the-scenes", "Vote on next piece"],
    color: "#ec4899",
    maxSubscribers: null,
    isActive: true,
    subscriberCount: 0,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

const SUBSCRIPTIONS = [
  {
    id: "sub_001",
    tierId: "tier_member",
    supporterWallet: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE",
    creatorWallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    status: "active",
    startedAt: new Date(Date.now() - 86400000 * 28).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    cancelledAt: null,
  },
  {
    id: "sub_002",
    tierId: "tier_member",
    supporterWallet: "4PsD3wX6qL2pR7vW5qT8nB1cF6dX2yH0aG3sE4r9x",
    creatorWallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    status: "active",
    startedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 16).toISOString(),
    cancelledAt: null,
  },
  {
    id: "sub_003",
    tierId: "tier_pro",
    supporterWallet: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd",
    creatorWallet: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r",
    status: "active",
    startedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 23).toISOString(),
    cancelledAt: null,
  },
];

const NOTIFICATIONS = [
  { walletAddress: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", type: "tip_received", title: "Tip Received", body: "You received 0.5 SOL from priya", data: { sender: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE", amount: "0.5", token: "SOL" }, isRead: true },
  { walletAddress: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", type: "badge_earned", title: "Badge Earned!", body: "Congratulations! You earned the Premier Creator badge.", data: { badge: "Premier Creator" }, isRead: false },
  { walletAddress: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE", type: "new_follower", title: "New Follower", body: "shivam started following you", data: { follower: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd" }, isRead: false },
  { walletAddress: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", type: "membership_activated", title: "New Subscriber", body: "shivam subscribed to Pro Supporter tier", data: { tier: "Pro Supporter", supporter: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd" }, isRead: false },
];

const BADGE_AWARDS = [
  { badgeSlug: "early-supporter", walletAddress: "8MHyRbX6ETA6QccwdCFCymFoTT5PRUxc6T9rFczb7QWd", awardedAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { badgeSlug: "bronze-tipper", walletAddress: "7GfH2aR9xK4mM3zL2pR7vW5qT8nB1cF6dX2yH0aG3sE", awardedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { badgeSlug: "verified-creator", walletAddress: "9xJ4mM3zK9L2pR7vW5qT8nB1cF6dX2yH0aG3sE4r", awardedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding comprehensive TipChain database...\n");

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
    // Collect unique supporters per creator (for accurate supporterCount)
    const uniqueSupporters = new Set(
      TIPS.filter((t) => t.receiver === creator.walletAddress).map((t) => t.sender)
    );
    const supporterCount = uniqueSupporters.size;

    const enrichedLinks = {
      ...links,
      _badges: [],
      _awards: BADGE_AWARDS.filter((b) => b.walletAddress === creator.walletAddress),
      _referrals: REFERRAL_CODES.filter((r) => r.creatorWallet === creator.walletAddress),
      _referral_uses: REFERRAL_USES.filter((u) => {
        const code = REFERRAL_CODES.find((r) => r.code === u.code);
        return code?.creatorWallet === creator.walletAddress;
      }),
      membership_tiers: MEMBERSHIP_TIERS.filter((t) => t.creatorWallet === creator.walletAddress),
      subscriptions: SUBSCRIPTIONS.filter((s) => s.creatorWallet === creator.walletAddress),
    };

    // Pre-calculate total tips received
    const totalTips = TIPS
      .filter((t) => t.receiver === creator.walletAddress)
      .reduce((sum, t) => sum + t.amount, 0n);

    await prisma.creator.create({
      data: {
        ...creator,
        socialLinks: JSON.stringify(enrichedLinks),
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
    const tx = await prisma.transaction.create({
      data: {
        senderWallet: tip.sender,
        receiverWallet: tip.receiver,
        amount: tip.amount,
        token: tip.token,
        message: tip.message,
        createdAt: new Date(Date.now() - (TIPS.length - i) * 86400000), // Spread over days
      },
    });

    // Upsert supporter
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

    // Update creator totalTips only (supporterCount is pre-calculated on creation)
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
  console.log(`   ${REFERRAL_CODES.length} referral codes`);
  console.log(`   ${MEMBERSHIP_TIERS.length} membership tiers`);
  console.log(`   ${SUBSCRIPTIONS.length} subscriptions`);
  console.log(`   ${NOTIFICATIONS.length} notifications`);
  console.log(`   ${BADGE_AWARDS.length} badge awards`);

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
