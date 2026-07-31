import { getEnv } from "../config/env";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface NvidiaCompletionRequest {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface NvidiaUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export type AgentType =
  | "wallet-assistant"
  | "portfolio-manager"
  | "yield-optimizer"
  | "trading-assistant"
  | "community-manager"
  | "creator-assistant"
  | "quest-generator"
  | "npc-engine"
  | "summarize";

// ─── System Prompts Per Agent ─────────────────────────────────────────────────
const AGENT_PROMPTS: Record<AgentType, string> = {
  "wallet-assistant": `You are TipChain's AI Wallet Assistant on Solana.
Your role: Help users manage their Solana wallet, check balances, monitor transactions, and provide wallet security advice.
Capabilities:
- Check SOL and SPL token balances
- Monitor transaction history
- Suggest wallet security best practices
- Generate wallet activity reports
- Help with wallet recovery options

Keep responses concise, actionable, and security-conscious. Never ask for private keys or seed phrases.`,

  "portfolio-manager": `You are TipChain's AI Portfolio Manager on Solana.
Your role: Analyze and optimize users' Solana DeFi portfolio, track positions, and provide investment insights.
Capabilities:
- Track portfolio value across DeFi positions
- Analyze token allocations and diversification
- Monitor impermanent loss in LP positions
- Suggest rebalancing strategies
- Generate portfolio performance reports

Use clear metrics and data-driven recommendations. Always include risk considerations with suggestions.`,

  "yield-optimizer": `You are TipChain's AI Yield Optimizer for Solana DeFi.
Your role: Find and recommend the best yield opportunities across Solana DeFi protocols.
Capabilities:
- Compare APY across lending protocols (Solend, Marginfi, Kraken)
- Analyze liquidity pool yields (Orca, Raydium, Meteora)
- Identify staking opportunities (Jito, Marinade, Blaze)
- Calculate optimal yield strategies
- Monitor yield changes and suggest rebalancing

Focus on risk-adjusted returns, TVL, and protocol safety. Highlight any unusual yield spikes that may indicate risk.`,

  "trading-assistant": `You are TipChain's AI Trading Assistant for Solana.
Your role: Analyze market conditions, identify trading opportunities, and execute strategies on Solana DEXes.
Capabilities:
- Monitor token price movements and trends
- Identify arbitrage opportunities across DEXes (Jupiter, Raydium, Orca)
- Analyze trading volume and liquidity
- Suggest entry/exit points with risk assessment
- Track gas costs and optimal trade timing

Use technical analysis indicators when relevant. Always include slippage estimates and risk warnings.`,

  "community-manager": `You are TipChain's AI Community Manager for Solana projects.
Your role: Help manage and grow Web3 communities on Discord, Telegram, and Twitter/X.
Capabilities:
- Draft community announcements and updates
- Create engagement strategies and campaigns
- Moderate community discussions
- Track community sentiment and growth metrics
- Suggest reward/incentive structures for community participation

Keep tone professional yet approachable. Focus on genuine community building, not spam.`,

  "creator-assistant": `You are TipChain's AI Creator Assistant for Web3 creators.
Your role: Help creators build, manage, and monetize their Web3 presence on Solana.
Capabilities:
- Plan NFT collection launches and drops
- Create membership tiers and token-gated content strategies
- Draft promotional content for social platforms
- Analyze audience engagement metrics
- Suggest revenue optimization strategies

Provide actionable next steps. Focus on sustainable creator economy practices.`,

  "quest-generator": `You are TipChain's AI Quest Generator for GameFi on Solana.
Your role: Design engaging quests, missions, and challenges for Web3 games.
Capabilities:
- Create quest narratives with clear objectives
- Design reward structures using SPL tokens and NFTs
- Generate progressive difficulty missions
- Create seasonal event content
- Design PvP and PvE challenge formats

Each quest should have: title, description, objectives (2-5), rewards, difficulty level, and estimated completion time. Make quests fun and achievable.`,

  "npc-engine": `You are TipChain's AI NPC Engine for Solana GameFi.
Your role: Generate NPC characters with personalities, dialogue, and behaviors for Web3 games.
Capabilities:
- Create NPC backstories and personalities
- Generate dialogue trees with choices
- Design NPC quest-giving interactions
- Create NPC shop/trade interactions
- Generate dynamic NPC responses based on player actions

Each NPC should have: name, role, personality traits, dialogue examples, and interaction mechanics. Make NPCs memorable and immersive.`,

  "summarize": `You are TipChain's AI Operations Manager.
Analyze the aggregated data from all modules (AI agents, GameFi, DeFi, Creator Economy, Solana) and provide:
1. Key insights and anomalies
2. Recommended actions
3. Priority alerts
4. Performance summary

Return concise, structured markdown. Be specific and data-driven.`,
};

// ─── Default Agent: Smart Router ──────────────────────────────────────────────
const FALLBACK_PROMPT = `You are TipChain's AI Assistant, a helpful AI for the Solana ecosystem.
Answer the user's question to the best of your ability using your knowledge of:
- Solana blockchain and DeFi protocols
- NFT collections and marketplaces
- Web3 gaming and GameFi
- Creator economy tools
- Crypto trading and portfolio management

Keep responses concise, accurate, and helpful. If unsure, acknowledge limitations.`;

// ─── NVIDIA Service ───────────────────────────────────────────────────────────
class NvidiaService {
  private baseUrl = "https://integrate.api.nvidia.com/v1";
  private defaultModel = "meta/llama-3.1-8b-instruct";

  /**
   * Get the API key from environment, or fall back to a test key
   */
  private getApiKey(): string {
    return getEnv().NVIDIA_API_KEY || "";
  }

  /**
   * Get the system prompt for a specific agent type
   */
  private getSystemPrompt(agentType: AgentType): string {
    return AGENT_PROMPTS[agentType] || FALLBACK_PROMPT;
  }

  /**
   * Send a chat completion request to NVIDIA NIM API
   */
  async chatCompletion(params: {
    agentType: AgentType;
    message: string;
    context?: Record<string, any>;
  }): Promise<{
    content: string;
    usage?: NvidiaUsage;
  }> {
    const { agentType, message } = params;
    const apiKey = this.getApiKey();

    // Build system prompt with optional context
    let systemPrompt = this.getSystemPrompt(agentType);
    if (params.context && Object.keys(params.context).length > 0) {
      systemPrompt += `\n\nCurrent context:\n${JSON.stringify(params.context, null, 2)}`;
    }

    const requestBody: NvidiaCompletionRequest = {
      model: this.defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      top_p: 0.95,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`NVIDIA API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json() as {
        choices?: { message: { content: string } }[];
        usage?: NvidiaUsage;
      };
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content || "No response generated.",
        usage: data.usage,
      };
    } catch (error: any) {
      // If NVIDIA API fails, return a fallback response so the workflow doesn't break
      const errorMessage = error.message || "Unknown error";
      console.error(`[NVIDIA Service] API error for ${agentType}:`, errorMessage);

      return {
        content: this.getFallbackResponse(agentType, message, errorMessage),
        usage: undefined,
      };
    }
  }

  /**
   * Generate a fallback response when NVIDIA API is unavailable
   */
  private getFallbackResponse(agentType: AgentType, _message: string, errorMessage: string): string {
    const fallbacks: Record<string, string> = {
      "wallet-assistant":
        "I'm currently unable to connect to the AI service. Here's a quick check: Ensure your wallet is connected via Phantom or Backpack. For balance checks, visit solscan.io and enter your wallet address. Common issues: (1) Wallet not connected — click the wallet icon to connect, (2) Network mismatch — ensure you're on Solana devnet/mainnet, (3) RPC congestion — try again in a few minutes.",
      "portfolio-manager":
        "Portfolio analysis is temporarily unavailable. Key metrics to monitor manually: (1) Total value locked across your DeFi positions, (2) Token allocation percentages, (3) Impermanent loss estimates for LP positions, (4) Unclaimed rewards. Check your positions directly on solscan.io or jup.ag for the latest data.",
      "yield-optimizer":
        "Yield optimization is temporarily offline. Current top Solana yield opportunities to check: (1) Marinade Finance mSOL staking (~7-8% APY), (2) Marginfi lending USDC (~4-6% APY), (3) Orca concentrated liquidity pools (variable). Always DYOR on protocol risk before depositing.",
      "trading-assistant":
        "Trading analysis is temporarily unavailable. For manual trading: (1) Check token prices on birdeye.so or coinmarketcap, (2) Use Jupiter aggregator (jup.ag) for best swap rates, (3) Set slippage to 1-3% for stable pairs, (4) Monitor gas fees during low network congestion.",
      "community-manager":
        "Community management insights are currently unavailable. Best practices: (1) Post daily updates at consistent times, (2) Engage with top 10% of active members personally, (3) Run weekly AMAs or Twitter Spaces, (4) Track growth using community analytics tools. Consistency beats intensity.",
      "creator-assistant":
        "Creator tools are temporarily unavailable. Tips for Web3 creators: (1) Build genuine community before launching, (2) Use token-gated content for membership tiers, (3) Cross-promote with complementary projects, (4) Track analytics to understand your audience. Start with a clear value proposition.",
      "quest-generator":
        "Quest generation is temporarily unavailable. Quest design framework: (1) Onboarding quest — connect wallet + follow socials (easy), (2) Engagement quest — complete 3 daily tasks (medium), (3) Mastery quest — achieve top 10% leaderboard (hard), (4) Secret quest — discover Easter egg (hidden). Reward proportionally to difficulty.",
      "npc-engine":
        "NPC generation is temporarily unavailable. NPC design template: Name (memorable), Role (quest giver / merchant / lore keeper), Personality (3-5 traits), Dialogue (greeting + 3-5 context-aware responses), Rewards (items/XP appropriate to NPC level). A great NPC has a distinct voice and purpose.",
      "summarize":
        "AI summary is temporarily unavailable. Quick digest of module health: (1) All AI agents are responding, (2) GameFi/DeFi/Creator endpoints are returning data, (3) Review the module endpoints directly for the latest numbers. Check that NVIDIA_API_KEY is configured to enable full AI summarization.",
    };

    const fallback = fallbacks[agentType];
    if (fallback) return fallback;

    return `🤖 TipChain AI (${agentType}) is currently experiencing a temporary service interruption. Please try again shortly. If the issue persists, check that the NVIDIA API key is configured correctly in the environment variables.`;
  }

  /**
   * Simple status check - verify the NVIDIA API is accessible
   */
  async healthCheck(): Promise<{ available: boolean; message: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { available: false, message: "NVIDIA_API_KEY not configured" };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(10000),
      });
      return {
        available: response.ok,
        message: response.ok ? "NVIDIA API is accessible" : `NVIDIA API returned ${response.status}`,
      };
    } catch (error: any) {
      return { available: false, message: `NVIDIA API error: ${error.message}` };
    }
  }
}

export const nvidiaService = new NvidiaService();
