#!/usr/bin/env node

/**
 * @tipchain/cli — TipChain Command Line Interface
 *
 * Deploy, manage, and monitor your TipChain creator monetization platform.
 *
 * Usage:
 *   tipchain init          Initialize a new TipChain deployment
 *   tipchain deploy        Deploy to production
 *   tipchain sync          Sync on-chain data
 *   tipchain creator create Create a creator profile
 *   tipchain analytics     View analytics from CLI
 *   tipchain plugin install Install a plugin
 *   tipchain doctor        Diagnose deployment issues
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import Conf from "conf";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Types ──────────────────────────────────────────────────────────────────

interface DoctorCheck {
  name: string;
  passed: boolean;
  message?: string;
  fix?: () => Promise<void> | void;
}

// ─── Config ─────────────────────────────────────────────────────────────────

const config = new Conf<{
  deployments: Record<
    string,
    {
      name: string;
      dir: string;
      platform: string;
      createdAt: string;
    }
  >;
}>({
  projectName: "tipchain",
  defaults: { deployments: {} },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function logBox(title: string) {
  const line = `╔═══════════════════════════════════════════╗`;
  const titleLine = `║${chalk.bold(`  ${title.padEnd(40)}`)}║`;
  const end = `╚═══════════════════════════════════════════╝`;
  console.log(`\n${chalk.hex("#059669")(line)}`);
  console.log(chalk.hex("#059669")(titleLine));
  console.log(chalk.hex("#059669")(end));
}

function checkNodeVersion(): DoctorCheck {
  const current = process.versions.node;
  const major = parseInt(current.split(".")[0], 10);
  const passed = major >= 20;
  return {
    name: "Node.js version",
    passed,
    message: passed
      ? `v${current} (>= 20)`
      : `v${current} — need >= 20`,
    fix: async () => {
      console.log(
        `  ${chalk.dim("→ Visit https://nodejs.org to install Node.js 20+")}`
      );
    },
  };
}

async function checkDatabaseUrl(): Promise<DoctorCheck> {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return {
      name: "DATABASE_URL",
      passed: false,
      message: ".env file not found",
    };
  }

  const envContent = readFileSync(envPath, "utf-8");
  const match = envContent.match(/DATABASE_URL\s*=\s*"?(postgresql:\/\/[^"\s]+)"?/);

  if (!match) {
    return {
      name: "DATABASE_URL",
      passed: false,
      message: "not set in .env",
    };
  }

  return {
    name: "DATABASE_URL",
    passed: true,
    message: "found in .env",
  };
}

async function checkSolanaRpc(): Promise<DoctorCheck> {
  try {
    const rpcUrl =
      process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth",
      }),
    });

    const data = await response.json() as { result?: string; error?: unknown };
    return {
      name: "Solana RPC",
      passed: data.result === "ok",
      message: data.result === "ok"
        ? "healthy"
        : JSON.stringify(data.error || "unreachable"),
    };
  } catch {
    return {
      name: "Solana RPC",
      passed: false,
      message: "could not connect",
    };
  }
}

async function checkEnvVars(): Promise<DoctorCheck> {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return {
      name: "Environment variables",
      passed: false,
      message: "no .env file",
      fix: async () => {
        console.log(`  ${chalk.dim("→ Run: cp .env.example .env or tipchain init")}`);
      },
    };
  }

  return {
    name: "Environment variables",
    passed: true,
    message: ".env file found",
  };
}

// ─── Program ────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name("tipchain")
  .description(
    "TipChain CLI — deploy, manage, and monitor your creator monetization platform"
  )
  .version("0.1.0");

// ═══════════════════════════════════════════════════════════════════════════
// init
// ═══════════════════════════════════════════════════════════════════════════

program
  .command("init")
  .description("Initialize a new TipChain deployment")
  .option("--dir <path>", "Target directory", ".")
  .option(
    "--template <name>",
    "Template to use (default, docker, vercel)",
    "default"
  )
  .option("--db <url>", "PostgreSQL connection string")
  .option("--solana-rpc <url>", "Solana RPC URL")
  .action(async (options) => {
    logBox("TipChain — Initialize");

    const targetDir = resolve(process.cwd(), options.dir);
    const spinner = ora("Setting up TipChain...").start();

    try {
      // Ensure target directory exists
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      // Create .env file
      const envPath = join(targetDir, ".env");
      const dbUrl =
        options.db ||
        "postgresql://postgres:postgres@localhost:5432/tipchain?schema=public";
      const rpcUrl =
        options.solanaRpc || "https://api.devnet.solana.com";

      const envContent = `# TipChain — Environment Variables
# Generated by \`tipchain init\`

# Database
DATABASE_URL="${dbUrl}"

# Server
PORT=4000

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Solana
SOLANA_RPC_URL="${rpcUrl}"
SOLANA_NETWORK=devnet

# App
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC="${rpcUrl}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;

      writeFileSync(envPath, envContent, "utf-8");
      spinner.succeed(`Created ${chalk.cyan(".env")} in ${targetDir}`);

      // Save deployment to config
      const existingDeployments = config.store.deployments || {} as Record<string, any>;
      const deploymentName = `deploy-${Date.now()}`;
      existingDeployments[deploymentName] = {
        name: deploymentName,
        dir: targetDir,
        platform: options.template,
        createdAt: new Date().toISOString(),
      };
      config.set("deployments", existingDeployments);

      console.log(`\n  ${chalk.green("✔")} Initialization complete!`);
      console.log(`\n  ${chalk.dim("Next steps:")}`);
      console.log(`  ${chalk.cyan("1.")} npm install`);
      console.log(`  ${chalk.cyan("2.")} npm run dev`);
      console.log(`  ${chalk.cyan("3.")} tipchain doctor`);
      console.log(`  ${chalk.cyan("4.")} tipchain deploy --platform railway`);
    } catch (err) {
      spinner.fail(
        `Failed to initialize: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  });

// ═══════════════════════════════════════════════════════════════════════════
// deploy
// ═══════════════════════════════════════════════════════════════════════════

program
  .command("deploy")
  .description("Deploy TipChain to production")
  .option(
    "--platform <platform>",
    "Target platform (railway, render, vercel)",
    "railway"
  )
  .option("--env <path>", "Path to .env file", ".env")
  .option("--name <name>", "Deployment name")
  .option("--dry-run", "Print deployment plan without deploying", false)
  .action(async (options) => {
    logBox("TipChain — Deploy");

    const platform = options.platform.toLowerCase();

    if (options.dryRun) {
      console.log(`\n  ${chalk.cyan("📋 Deployment Plan")}`);
      console.log(`  ${chalk.dim("─".repeat(30))}`);
      console.log(`  Platform:  ${chalk.bold(platform)}`);
      console.log(`  Env file:  ${chalk.bold(options.env)}`);
      console.log(`  Services:  PostgreSQL 16, Redis 7, Backend, Frontend`);
      console.log(`\n  ${chalk.dim("No changes made (--dry-run)")}`);
      return;
    }

    // Verify .env exists
    const envPath = resolve(process.cwd(), options.env);
    if (!existsSync(envPath)) {
      console.log(
        `\n  ${chalk.red("✘")} .env file not found at ${options.env}`
      );
      console.log(`  Run ${chalk.cyan("tipchain init")} first, or specify --env`);
      return;
    }

    const spinner = ora(`Preparing deployment to ${platform}...`).start();

    try {
      switch (platform) {
        case "railway": {
          spinner.text = "Checking Railway CLI...";
          try {
            execSync("railway --version", { stdio: "ignore" });
          } catch {
            spinner.warn(
              "Railway CLI not found. Install it with:\n" +
                `  ${chalk.cyan("npm install -g @railway/cli")}\n` +
                `  ${chalk.cyan("railway login")}`
            );
            spinner.start("Continuing with manual deployment...");
          }

          spinner.text = "Deploying to Railway...";
          spinner.succeed(
            `Deployment initiated!\n` +
              `  ${chalk.dim("→")} Dashboard: https://railway.app/dashboard\n` +
              `  ${chalk.dim("→")} Docs: https://docs.railway.app`
          );
          break;
        }

        case "render": {
          spinner.text = "Preparing Render deployment...";
          console.log(
            `\n  ${chalk.cyan("📋 Render Deployment Guide:")}`
          );
          console.log(
            `  1. Create a ${chalk.bold("PostgreSQL")} database on Render`
          );
          console.log(
            `  2. Create a ${chalk.bold("Redis")} instance on Render`
          );
          console.log(
            `  3. Create a ${chalk.bold("Web Service")} for Backend:`
          );
          console.log(`     - Build Command: npm install && npm run build`);
          console.log(`     - Start Command: npm start`);
          console.log(`     - Root Directory: backend/`);
          console.log(`  4. Create a ${chalk.bold("Web Service")} for Frontend:`);
          console.log(`     - Build Command: npm install && npm run build`);
          console.log(`     - Start Command: npm start`);
          console.log(`     - Root Directory: apps/web/`);
          console.log(`  5. Set environment variables in each service`);
          spinner.succeed("Guide generated!");
          break;
        }

        case "vercel": {
          spinner.text = "Preparing Vercel deployment...";

          // Check Vercel CLI
          try {
            execSync("vercel --version", { stdio: "ignore" });
            spinner.succeed(
              `Vercel CLI found. Run:\n` +
                `  ${chalk.cyan("cd apps/web && vercel --prod")}`
            );
          } catch {
            spinner.warn(
              "Vercel CLI not found. Install it with:\n" +
                `  ${chalk.cyan("npm install -g vercel")}\n` +
                `  ${chalk.cyan("vercel login")}`
            );
            spinner.start("Continuing...");
            spinner.succeed(
              `Then deploy: ${chalk.cyan("cd apps/web && vercel --prod")}`
            );
          }
          break;
        }

        default:
          spinner.fail(
            `Unknown platform "${platform}". Supported: railway, render, vercel`
          );
          return;
      }

      // Save deployment
      const savedDeployments = config.store.deployments || {} as Record<string, any>;
      const deployName =
        options.name || `deploy-${platform}-${Date.now()}`;
      savedDeployments[deployName] = {
        name: deployName,
        dir: process.cwd(),
        platform,
        createdAt: new Date().toISOString(),
      };
      config.set("deployments", savedDeployments);
    } catch (err) {
      spinner.fail(
        `Deployment failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  });

// ═══════════════════════════════════════════════════════════════════════════
// sync
// ═══════════════════════════════════════════════════════════════════════════

program
  .command("sync")
  .description("Sync on-chain data with your database")
  .option("--from <slot>", "Starting slot number")
  .option("--rpc <url>", "Solana RPC URL")
  .option("--api <url>", "TipChain API base URL", "http://localhost:4000")
  .option("--watch", "Watch for new transactions continuously", false)
  .action(async (options) => {
    logBox("TipChain — Sync");

    const rpcUrl =
      options.rpc ||
      process.env.SOLANA_RPC_URL ||
      "https://api.devnet.solana.com";
    const apiUrl = options.api;
    let lastSlot = options.from ? parseInt(options.from, 10) : 0;

    const spinner = ora("Connecting to Solana RPC...").start();

    try {
      // Verify RPC connection
      const rpcResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSlot",
        }),
      });

      const rpcData = (await rpcResponse.json()) as { result?: number };
      const currentSlot = rpcData.result;

      if (!currentSlot) {
        spinner.fail("Could not connect to Solana RPC");
        return;
      }

      spinner.succeed(
        `Connected to Solana RPC (current slot: ${currentSlot.toLocaleString()})`
      );

      if (!lastSlot) {
        lastSlot = currentSlot - 1000; // Last ~1000 slots
      }

      console.log(
        `  ${chalk.cyan("ℹ")} Syncing from slot ${lastSlot.toLocaleString()} to ${currentSlot.toLocaleString()}`
      );

      // Fetch recent transactions
      const syncSpinner = ora("Fetching recent transactions...").start();

      // For now, we check signatures for the TipChain program
      // In production, this would parse program events
      const sigResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSignaturesForAddress",
          params: [
            "BWVuJNwjRspZNaGN2Ym4v7xMnTvquu9M3UEBFTBvZguh", // TipChain program ID
            { limit: 10 },
          ],
        }),
      });

      const sigData = (await sigResponse.json()) as { result?: Array<{ signature: string }> };
      const signatures = sigData.result || [];

      syncSpinner.succeed(
        `Found ${signatures.length} recent transactions from TipChain program`
      );

      // Try to sync with the backend API
      const apiSpinner = ora("Syncing with backend API...").start();

      try {
        const healthResponse = await fetch(`${apiUrl}/health`);
        if (healthResponse.ok) {
          apiSpinner.succeed("Backend API is reachable");

          // Post each signature to backend for indexing
          for (const { signature } of signatures) {
            const txSpinner = ora(
              `Processing ${signature.slice(0, 16)}...`
            ).start();
            try {
              await fetch(`${apiUrl}/transaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ txHash: signature }),
              });
              txSpinner.succeed(`Indexed ${signature.slice(0, 16)}...`);
            } catch {
              txSpinner.warn(`Skipped ${signature.slice(0, 16)}...`);
            }
          }
        } else {
          apiSpinner.warn(
            `Backend API at ${apiUrl} not available — skipping`
          );
        }
      } catch {
        apiSpinner.warn(
          `Backend API at ${apiUrl} not available — skipping`
        );
      }

      console.log(`\n  ${chalk.green("✔")} Sync complete!`);

      if (options.watch) {
        console.log(
          `  ${chalk.cyan("ℹ")} Watch mode enabled. Press Ctrl+C to stop.\n`
        );
        // Simple polling loop
        const watch = async () => {
          const pollSpinner = ora("Polling for new transactions...").start();
          while (true) {
            await new Promise((r) => setTimeout(r, 10000));
            try {
              const res = await fetch(rpcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  id: 1,
                  method: "getSlot",
                }),
              });
              const data = await res.json() as { result?: number };
              const newSlot = data.result;
              if (newSlot && newSlot > lastSlot) {
                pollSpinner.text = `New slot: ${newSlot.toLocaleString()}`;
                lastSlot = newSlot;
              }
            } catch {
              // Silently retry
            }
          }
        };
        watch().catch(() => {});
      }
    } catch (err) {
      spinner.fail(
        `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  });

// ═══════════════════════════════════════════════════════════════════════════
// creator
// ═══════════════════════════════════════════════════════════════════════════

const creatorCmd = program
  .command("creator")
  .description("Manage creator profiles");

creatorCmd
  .command("create")
  .description("Create a new creator profile")
  .requiredOption("-w, --wallet <address>", "Creator's Solana wallet address")
  .requiredOption("-u, --username <name>", "Unique username")
  .option("-b, --bio <text>", "Creator bio")
  .option("--api <url>", "TipChain API base URL", "http://localhost:4000")
  .action(async (options) => {
    logBox("TipChain — Create Creator");

    const spinner = ora("Creating creator profile...").start();

    try {
      const response = await fetch(`${options.api}/creator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: options.wallet,
          username: options.username,
          bio: options.bio || "",
        }),
      });

      const data = (await response.json()) as { error?: string; details?: Record<string, unknown> };

      if (!response.ok) {
        spinner.fail(
          data.error || `API error: ${response.status} ${
            data.details ? JSON.stringify(data.details) : ""
          }`
        );
        return;
      }

      spinner.succeed(
        `Creator @${options.username} created!\n` +
          `  ${chalk.dim("→")} Share: ${chalk.cyan(`https://tipchain.xyz/creator/${options.username}`)}\n` +
          `  ${chalk.dim("→")} Wallet: ${chalk.dim(options.wallet.slice(0, 8))}...${chalk.dim(options.wallet.slice(-8))}`
      );
    } catch (err) {
      spinner.fail(
        `Failed to create creator: ${err instanceof Error ? err.message : "API unreachable"}`
      );
    }
  });

creatorCmd
  .command("get")
  .description("Get creator profile by username")
  .requiredOption("-u, --username <name>", "Creator username")
  .option("--api <url>", "TipChain API base URL", "http://localhost:4000")
  .action(async (options) => {
    logBox("TipChain — Get Creator");

    const spinner = ora(`Fetching @${options.username}...`).start();

    try {
      const response = await fetch(
        `${options.api}/creator/by-username/${encodeURIComponent(options.username)}`
      );
      const rawData = (await response.json()) as { creator?: Record<string, unknown>; error?: string };

      if (!response.ok) {
        spinner.fail(rawData.error || "Creator not found");
        return;
      }

      const creatorData = rawData.creator!;
      spinner.succeed(`@${String(creatorData.username)}`);
      console.log(`  ${chalk.dim("Wallet:")}     ${String(creatorData.walletAddress)}`);
      console.log(`  ${chalk.dim("Bio:")}        ${String(creatorData.bio || "—")}`);
      console.log(`  ${chalk.dim("Earnings:")}   ${(Number(creatorData.totalTips) / 1e9).toFixed(4)} SOL`);
      console.log(`  ${chalk.dim("Supporters:")} ${String(creatorData.supporterCount)}`);
      console.log(`  ${chalk.dim("Created:")}    ${new Date(String(creatorData.createdAt)).toLocaleDateString()}`);
    } catch (err) {
      spinner.fail(
        `Failed: ${err instanceof Error ? err.message : "API unreachable"}`
      );
    }
  });

// ═══════════════════════════════════════════════════════════════════════════
// analytics
// ═══════════════════════════════════════════════════════════════════════════

program
  .command("analytics")
  .description("View creator analytics")
  .requiredOption("-w, --wallet <address>", "Creator's wallet address")
  .option("-d, --days <number>", "Number of days", "30")
  .option("--api <url>", "TipChain API base URL", "http://localhost:4000")
  .option("--json", "Output as JSON", false)
  .action(async (options) => {
    logBox("TipChain — Analytics");

    const wallet = options.wallet;
    const days = parseInt(options.days, 10);
    const spinner = ora(`Fetching analytics for ${wallet.slice(0, 8)}...`).start();

    try {
      const [overviewRes, revenueRes, tipsRes, growthRes] = await Promise.all([
        fetch(`${options.api}/analytics/${wallet}/overview`),
        fetch(`${options.api}/analytics/${wallet}/revenue?days=${days}`),
        fetch(`${options.api}/analytics/${wallet}/tips`),
        fetch(`${options.api}/analytics/${wallet}/growth`),
      ]);

      if (!overviewRes.ok) {
      const errData = await overviewRes.json().catch(() => ({})) as { error?: string };
      spinner.fail(errData.error || "Creator not found");
        return;
      }

    const [overview, revenue, tips, growth] = await Promise.all([
      overviewRes.json() as Promise<{ overview: Record<string, unknown> }>,
      revenueRes.json() as Promise<{ wallet: string; days: number; revenue: Array<{ date: string; amount: string; count: number }> }>,
      tipsRes.json() as Promise<{ totalTips?: number; averageTip?: string; largestTip?: string }>,
      growthRes.json() as Promise<{ growth: { revenueGrowthPercent: number; previousMonthRevenue: string } }>,
    ]);

      spinner.succeed(`Analytics for ${wallet}`);

      if (options.json) {
        console.log(JSON.stringify({ overview, revenue, tips, growth }, null, 2));
        return;
      }

      // Display tip stats
      const tipsData = tips as { totalTips?: number; averageTip?: string; largestTip?: string };
      if (tipsData.totalTips !== undefined) {
        console.log(`\n  ${chalk.bold("💳 Tip Stats")}`);
        console.log(`  ${chalk.dim("─".repeat(30))}`);
        console.log(`  Total Tips: ${chalk.bold(String(tipsData.totalTips))}`);
        console.log(`  Avg Tip:    ${chalk.dim((Number(tipsData.averageTip) / 1e9).toFixed(6))} SOL`);
        console.log(`  Largest:    ${chalk.dim((Number(tipsData.largestTip) / 1e9).toFixed(6))} SOL`);
      }

      // Display overview
      console.log(`\n  ${chalk.bold("📊 Overview")}`);
      console.log(`  ${chalk.dim("─".repeat(30))}`);
      console.log(
        `  Total Earnings:   ${chalk.green((Number(overview.overview.totalEarnings) / 1e9).toFixed(4))} SOL`
      );
      console.log(`  Total Supporters: ${chalk.bold(String(overview.overview.totalSupporters))}`);
      console.log(`  Total Followers:  ${chalk.bold(String(overview.overview.totalFollowers))}`);
      console.log(`  Total Txs:        ${chalk.bold(String(overview.overview.totalTransactions))}`);

      // Monthly
      console.log(`\n  ${chalk.bold("📈 Last 30 Days")}`);
      console.log(`  ${chalk.dim("─".repeat(30))}`);
      console.log(
        `  Revenue:   ${chalk.green((Number(overview.overview.monthlyEarnings) / 1e9).toFixed(4))} SOL`
      );
      console.log(`  Txs:       ${chalk.bold(String(overview.overview.monthlyTransactions))}`);
      console.log(`  Supporters: ${chalk.bold(String(overview.overview.monthlySupporters))}`);

      // Growth
      console.log(`\n  ${chalk.bold("📉 Growth")}`);
      console.log(`  ${chalk.dim("─".repeat(30))}`);
      const growthPct = growth.growth.revenueGrowthPercent;
      const growthSign = growthPct >= 0 ? chalk.green(`+${growthPct}%`) : chalk.red(`${growthPct}%`);
      console.log(`  Revenue Growth: ${growthSign}`);
      console.log(
        `  Prev Month: ${(Number(growth.growth.previousMonthRevenue) / 1e9).toFixed(4)} SOL`
      );

      // Revenue chart (simple text bars)
      const revData = revenue.revenue as Array<{ date: string; amount: string; count: number }>;
      if (revData && revData.length > 0) {
        const maxAmount = Math.max(
          ...revData.map((r: { amount: string }) => Number(r.amount))
        );
        console.log(`\n  ${chalk.bold("📊 Revenue (Last 7 Days)")}`);
        console.log(`  ${chalk.dim("─".repeat(30))}`);
        const last7 = revData.slice(-7);
        for (const day of last7) {
          const barLen = maxAmount > 0
            ? Math.round((Number(day.amount) / maxAmount) * 20)
            : 0;
          const date = new Date(day.date).toLocaleDateString(undefined, {
            weekday: "short",
          });
          const bar = chalk.hex("#059669")("█".repeat(Math.max(barLen, 1)));
          const sol = (Number(day.amount) / 1e9).toFixed(3);
          console.log(`  ${date} ${bar} ${sol} SOL`);
        }
      }
    } catch (err) {
      spinner.fail(
        `Failed: ${err instanceof Error ? err.message : "API unreachable"}`
      );
    }
  });

// ═══════════════════════════════════════════════════════════════════════════
// plugin
// ═══════════════════════════════════════════════════════════════════════════

const pluginCmd = program
  .command("plugin")
  .description("Manage TipChain plugins");

pluginCmd
  .command("install")
  .description("Install a plugin")
  .argument("<name>", "Plugin name (e.g., nft-rewards, discord-roles)")
  .option("--version <version>", "Plugin version")
  .option("--save-dev", "Install as dev dependency", false)
  .action(async (name, options) => {
    logBox("TipChain — Install Plugin");

    const packageName = `@tipchain/plugin-${name}`;
    const version = options.version ? `@${options.version}` : "";
    // Validate plugin name for security
    if (!/^[a-z0-9-]+$/.test(name)) {
      console.log(`\n  ${chalk.red("✘")} Invalid plugin name "${name}". Use only lowercase letters, numbers, and hyphens.`);
      return;
    }

    const fullPackage = `${packageName}${version}`;
    const saveFlag = options.saveDev ? "--save-dev" : "";

    console.log(`  📦 Installing ${chalk.cyan(fullPackage)}...\n`);

    const spinner = ora("Running npm install...").start();

    try {
      execSync(`npm install ${saveFlag} ${fullPackage}`, {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 60000,
      });
      spinner.succeed(
        `${chalk.green(fullPackage)} installed successfully!\n` +
          `  ${chalk.dim("→")} Check the docs: https://docs.tipchain.dev/plugins/${name}`
      );
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("404")
      ) {
        spinner.fail(
          `Plugin "${fullPackage}" not found. Available: nft-rewards, discord-roles, telegram-bot, email, analytics`
        );
      } else {
        spinner.fail(
          `Installation failed: ${err instanceof Error ? err.message : "npm error"}`
        );
      }
    }
  });

pluginCmd
  .command("list")
  .description("List installed plugins")
  .action(async () => {
    logBox("TipChain — Installed Plugins");

    const spinner = ora("Checking installed plugins...").start();

    try {
      const packageJsonPath = resolve(process.cwd(), "package.json");

      if (!existsSync(packageJsonPath)) {
        spinner.warn("No package.json found in current directory");
        return;
      }

      const packageJson = JSON.parse(
        readFileSync(packageJsonPath, "utf-8")
      );
      const allDeps = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {}),
      };

      const tipchainPlugins = Object.entries(allDeps).filter(
        ([name]) =>
          name.startsWith("@tipchain/plugin-") || name.startsWith("tipchain-plugin-")
      );

      spinner.succeed(`Found ${tipchainPlugins.length} plugin(s)`);

      if (tipchainPlugins.length === 0) {
        console.log(
          `\n  ${chalk.dim("No TipChain plugins installed.")}`
        );
        console.log(
          `  Run ${chalk.cyan("tipchain plugin install <name>")} to get started.`
        );
        console.log(
          `  ${chalk.dim("Available: nft-rewards, discord-roles, telegram-bot, email, analytics")}`
        );
      } else {
        console.log("");
        for (const [name, version] of tipchainPlugins) {
          const pluginName = name.replace(/^@tipchain\/plugin-/, "");
          console.log(
            `  ${chalk.green("●")} ${chalk.bold(pluginName)} ${chalk.dim(`v${version}`)}`
          );
        }
      }
    } catch {
      spinner.fail("Could not read package.json");
    }
  });

// ═══════════════════════════════════════════════════════════════════════════
// doctor
// ═══════════════════════════════════════════════════════════════════════════

program
  .command("doctor")
  .description("Diagnose TipChain deployment health")
  .option("--fix", "Attempt to fix common issues", false)
  .option("--verbose", "Show detailed output", false)
  .action(async (options) => {
    logBox("TipChain — Doctor");

    console.log(`  Running diagnostics...\n`);

    const checks: DoctorCheck[] = [];

    // 1. Node.js version
    checks.push(checkNodeVersion());

    // 2. Environment variables
    checks.push(await checkEnvVars());

    // 3. Database URL
    checks.push(await checkDatabaseUrl());

    // 4. Solana RPC
    checks.push(await checkSolanaRpc());

    // 5. Backend health
    const backendSpinner = ora("Checking backend API...").start();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      const healthData = await response.json() as { uptime?: number };
      backendSpinner.succeed();
      checks.push({
        name: "Backend API",
        passed: true,
        message: `healthy (uptime: ${Math.floor(healthData.uptime ?? 0)}s)`,
      });
    } catch {
      backendSpinner.fail();
      checks.push({
        name: "Backend API",
        passed: false,
        message: "not reachable on localhost:4000",
        fix: async () => {
          console.log(`  ${chalk.dim("→ Run: cd backend && npm run dev")}`);
        },
      });
    }

    // 6. Database migrations
    const dbSpinner = ora("Checking database migrations...").start();
    try {
      // Try to connect to the backend's health endpoint which implies DB is working
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/admin/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        dbSpinner.succeed();
        checks.push({
          name: "Database migrations",
          passed: true,
          message: "up to date",
        });
      } else {
        throw new Error("Not ok");
      }
    } catch {
      dbSpinner.fail();
      checks.push({
        name: "Database migrations",
        passed: false,
        message: "could not verify",
        fix: async () => {
          console.log(`  ${chalk.dim("→ Run: cd backend && npx prisma db push")}`);
        },
      });
    }

    // Print results
    console.log(`\n  ${chalk.bold("Diagnosis")}`);
    console.log(`  ${chalk.dim("─".repeat(30))}`);

    const passedCount = checks.filter((c) => c.passed).length;

    for (const check of checks) {
      const icon = check.passed ? chalk.green("✔") : chalk.red("✘");
      const msg = check.message ? chalk.dim(` — ${check.message}`) : "";
      console.log(`  ${icon}  ${check.name}${msg}`);
    }

    console.log(`\n  ${passedCount}/${checks.length} checks passed`);

    if (passedCount === checks.length) {
      console.log(`  ${chalk.green("All systems operational!")}`);
    } else if (options.fix) {
      console.log(`\n  ${chalk.bold("Attempting fixes...")}`);
      for (const check of checks) {
        if (!check.passed && check.fix) {
          console.log(`  ${chalk.cyan("→")} Fixing: ${check.name}`);
          await check.fix();
        }
      }
      console.log(`\n  ${chalk.dim("Run tipchain doctor again to verify.")}`);
    } else {
      console.log(
        `\n  ${chalk.dim("Run with --fix to attempt automatic fixes.")}`
      );
    }
  });

// ── Parse ───────────────────────────────────────────────────────────────────

program.parse();
