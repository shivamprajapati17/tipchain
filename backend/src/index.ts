import express from "express";
import cors from "cors";
import creatorRoutes from "./routes/creators";
import transactionRoutes from "./routes/transactions";
import leaderboardRoutes from "./routes/leaderboard";

const app = express();
const PORT = process.env.PORT ?? 4000;

// ── Middleware ──────────────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : undefined;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow specific FRONTEND_URL env var
      if (allowedOrigins && allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any localhost origin in development
      if (/^https?:\/\/localhost(:\d+)?$/i.test(origin)) return callback(null, true);
      callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// ── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use(creatorRoutes);
app.use(transactionRoutes);
app.use(leaderboardRoutes);

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Error Handler ───────────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// ── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[TipChain] API running at http://localhost:${PORT}`);
  console.log(`[TipChain] Health check: http://localhost:${PORT}/health`);
});

export default app;
