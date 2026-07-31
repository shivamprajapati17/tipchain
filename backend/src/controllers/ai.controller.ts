import { Request, Response } from "express";
import { nvidiaService, AgentType } from "../services/nvidia.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

/**
 * Generic handler for any AI agent type.
 * Reads agent type from URL params and message from request body.
 */
const handleAgentRequest = (agentType: AgentType) =>
  asyncHandler(async (req: Request, res: Response) => {
    const { message, context } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({
        success: false,
        error: "Message is required in the request body",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await nvidiaService.chatCompletion({
      agentType,
      message,
      context: context || {},
    });

    sendSuccess(res, {
      agent: agentType,
      content: result.content,
      usage: result.usage,
    });
  });

// ─── Individual Handlers ──────────────────────────────────────────────────────
export const walletAssistant = handleAgentRequest("wallet-assistant");
export const portfolioManager = handleAgentRequest("portfolio-manager");
export const yieldOptimizer = handleAgentRequest("yield-optimizer");
export const tradingAssistant = handleAgentRequest("trading-assistant");
export const communityManager = handleAgentRequest("community-manager");
export const creatorAssistant = handleAgentRequest("creator-assistant");
export const questGenerator = handleAgentRequest("quest-generator");
export const npcEngine = handleAgentRequest("npc-engine");
export const summarizeData = handleAgentRequest("summarize");

/**
 * AI system health check
 */
export const aiHealth = asyncHandler(async (_req: Request, res: Response) => {
  const health = await nvidiaService.healthCheck();
  sendSuccess(res, health);
});
