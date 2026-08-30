import { z } from "zod";

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Redis (optional)
  REDIS_URL: z.string().optional().default("redis://localhost:6379"),

  // Solana
  SOLANA_RPC_URL: z.string().url().default("https://api.devnet.solana.com"),
  SOLANA_NETWORK: z.enum(["devnet", "mainnet-beta", "testnet"]).default("devnet"),

  // JWT Authentication
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(100),

  // Pagination
  DEFAULT_PAGE_SIZE: z.coerce.number().positive().default(20),
  MAX_PAGE_SIZE: z.coerce.number().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    const formatted = result.error.flatten();
    for (const [key, messages] of Object.entries(formatted.fieldErrors)) {
      console.error(`   ${key}: ${messages?.join(", ")}`);
    }
    if (formatted.formErrors.length > 0) {
      console.error(`   Form: ${formatted.formErrors.join(", ")}`);
    }
    throw new Error("Invalid environment configuration. Check .env file.");
  }

  _env = result.data;
  return _env;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === "development";
}

export function isTest(): boolean {
  return getEnv().NODE_ENV === "test";
}
