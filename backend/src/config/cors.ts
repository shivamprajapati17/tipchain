import { CorsOptions } from "cors";
import { getEnv } from "./env";

export function getCorsOptions(): CorsOptions {
  const env = getEnv();
  const frontendUrls = env.FRONTEND_URL.split(",").map((u: string) => u.trim());

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (server-to-server, mobile apps, curl)
      if (!origin) return callback(null, true);

      // Allow configured frontend URLs
      if (frontendUrls.includes(origin)) return callback(null, true);

      // Allow localhost in development
      if (env.NODE_ENV === "development") {
        if (/^https?:\/\/localhost(:\d+)?$/i.test(origin)) return callback(null, true);
      }

      // Allow Vercel deployments
      if (/^https?:\/\/.+\.vercel\.app$/.test(origin)) return callback(null, true);

      // Allow custom domains
      if (/^https?:\/\/tipchain\.\w+/.test(origin)) return callback(null, true);

      callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "X-Request-ID",
      "X-CSRF-Token",
    ],
    exposedHeaders: [
      "X-Request-ID",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  };
}
