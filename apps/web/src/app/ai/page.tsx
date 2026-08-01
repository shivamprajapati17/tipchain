"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  MessageSquare,
  Zap,
  ChevronRight,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wallet,
  BarChart3,
  Sprout,
  CandlestickChart,
  Users,
  Palette,
  Swords,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import { AI_AGENTS, queryAIAgent } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "agent";
  content: string;
  agentId?: string;
}

// ─── Agent icon map (replaces the emoji icons from the API data) ────────────
const AGENT_ICONS: Record<string, typeof Bot> = {
  "wallet-assistant": Wallet,
  "portfolio-manager": BarChart3,
  "yield-optimizer": Sprout,
  "trading-assistant": CandlestickChart,
  "community-manager": Users,
  "creator-assistant": Palette,
  "quest-generator": Swords,
  "npc-engine": Gamepad2,
};

function AgentIcon({ agentId, className }: { agentId: string; className?: string }) {
  const Icon = AGENT_ICONS[agentId] ?? Bot;
  return <Icon className={className} />;
}

// ─── Agent Color Config ─────────────────────────────────────────────────────
const AGENT_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", gradient: "from-emerald-500 to-emerald-400" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", gradient: "from-blue-500 to-blue-400" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", gradient: "from-purple-500 to-purple-400" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", gradient: "from-cyan-500 to-cyan-400" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20", gradient: "from-pink-500 to-pink-400" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", gradient: "from-orange-500 to-orange-400" },
};

// ─── Motion ─────────────────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as const },
};

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function AIPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>("wallet-assistant");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "agent",
      content:
        "Welcome to TipChain AI. Pick an agent above and ask anything about Solana, DeFi, trading, or your Web3 projects — each one is tuned for a specific job.",
      agentId: "wallet-assistant",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentAgent = AI_AGENTS.find((a) => a.id === selectedAgent);
  const colors = AGENT_COLORS[currentAgent?.color || "emerald"];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setError(null);

    setMessages((prev) => [...prev, { role: "user", content: userMsg, agentId: selectedAgent }]);
    setLoading(true);

    try {
      const result = await queryAIAgent(selectedAgent, userMsg, {
        timestamp: new Date().toISOString(),
      });
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: result.content, agentId: selectedAgent },
      ]);
    } catch (err: any) {
      setError(err.message || "Failed to get AI response");
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: `Sorry, the AI service is unreachable right now. Error: ${err.message || "Unknown error"}`,
          agentId: selectedAgent,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "agent",
        content: `Chat cleared. How can the ${currentAgent?.name} help you?`,
        agentId: selectedAgent,
      },
    ]);
    setError(null);
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Ambient */}
      <div className="orb orb-1 -top-40 -right-40 opacity-40" />
      <div className="orb orb-2 -bottom-40 -left-40 opacity-30" />

      {/* Hero */}
      <section className="relative px-6 pt-14 pb-8 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              <Sparkles className="size-3" />
              NVIDIA NIM
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-[-0.03em] text-white leading-[1.05] max-w-3xl">
              Eight agents, one{" "}
              <span className="serif-accent text-cyan-300">human intent</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm md:text-base text-white/40 leading-relaxed">
              Each agent is a specialist — wallets, portfolios, yields, trades,
              communities, creators, quests, NPCs. Pick one and ask in plain
              language.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 pb-24">
        {/* Agent Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto py-4 mb-4 scrollbar-hide"
        >
          {AI_AGENTS.map((agent) => {
            const isSelected = selectedAgent === agent.id;
            const agentColors = AGENT_COLORS[agent.color] || AGENT_COLORS.emerald;
            return (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent.id);
                  setError(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? `${agentColors.bg} ${agentColors.text} ${agentColors.border} border`
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border border-transparent"
                }`}
              >
                <AgentIcon agentId={agent.id} className="size-3.5" />
                {agent.name}
                {isSelected && <CheckCircle2 className="size-3" />}
              </button>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-sm overflow-hidden flex flex-col"
            style={{ minHeight: "600px", maxHeight: "750px" }}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center size-8 rounded-lg ${colors.bg}`}>
                  <AgentIcon agentId={selectedAgent} className={`size-4 ${colors.text}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{currentAgent?.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="pulse-dot" />
                    <span className="text-[10px] text-emerald-400">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="flex items-center justify-center size-8 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
                  title="Clear chat"
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => {
                  const msgColors = AGENT_COLORS[AI_AGENTS.find((a) => a.id === msg.agentId)?.color || "emerald"];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "agent"
                            ? `${msgColors.bg} ${msgColors.text}`
                            : "bg-white/10 text-white/80"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  );
                })}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${colors.bg}`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className={`size-4 ${colors.text} animate-spin`} />
                        <span className={`text-sm ${colors.text} animate-pulse`}>
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Error banner */}
            {error && (
              <div className="px-5 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="size-3 shrink-0" />
                {error}
              </div>
            )}

            {/* Chat input */}
            <div className="p-4 border-t border-white/5 shrink-0">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 focus-within:border-cyan-500/30 transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${currentAgent?.name} something...`}
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/20 outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className={`flex items-center justify-center size-8 rounded-lg transition-all ${
                    loading || !input.trim()
                      ? "bg-white/10 text-white/30 cursor-not-allowed"
                      : `${colors.bg} ${colors.text} hover:opacity-80`
                  }`}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {[
                  "What can you help me with?",
                  "Check my portfolio",
                  "Best yield opportunities",
                  "Analyze market trends",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="px-3 py-1.5 text-[10px] rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Agent Info Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {/* Selected Agent Info */}
            <div className={`rounded-3xl border border-white/5 bg-white/[0.03] p-5 ${colors.border} border`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex items-center justify-center size-10 rounded-xl ${colors.bg}`}>
                  <AgentIcon agentId={selectedAgent} className={`size-5 ${colors.text}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{currentAgent?.name}</h3>
                  <span className={`text-[10px] ${colors.text}`}>Active Agent</span>
                </div>
              </div>
              <p className="text-xs text-white/40 leading-relaxed mb-4">{currentAgent?.desc}</p>
              <div className="flex items-center gap-2 text-[10px] text-white/30">
                <Zap className="size-3" />
                Powered by NVIDIA NIM
              </div>
            </div>

            {/* All Agents Quick List */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-5">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                All Agents
              </h3>
              <div className="space-y-2">
                {AI_AGENTS.map((agent) => {
                  const agentColors = AGENT_COLORS[agent.color] || AGENT_COLORS.emerald;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgent(agent.id);
                        setError(null);
                      }}
                      className={`flex items-center gap-3 w-full py-2 px-3 rounded-xl transition-all text-left ${
                        selectedAgent === agent.id
                          ? `${agentColors.bg} ${agentColors.text}`
                          : "hover:bg-white/5"
                      }`}
                    >
                      <AgentIcon agentId={agent.id} className="size-4 shrink-0" />
                      <span className="text-xs font-medium truncate">{agent.name}</span>
                      <ChevronRight className={`size-3 ml-auto ${
                        selectedAgent === agent.id ? agentColors.text : "text-white/20"
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-5">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">API Status</span>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <span className="pulse-dot" /> Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">Model</span>
                  <span className="text-xs font-medium text-white">Llama 3.1 8B</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">Provider</span>
                  <span className="text-xs font-medium text-white">NVIDIA NIM</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
