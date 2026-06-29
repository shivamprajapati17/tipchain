import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    setupFiles: [],
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/**/*.types.ts"],
    },
    // Mock .env variables for tests
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/tipchain_test",
      JWT_SECRET: "test-jwt-secret-key-at-least-32-chars-long-for-hs256",
      JWT_REFRESH_SECRET: "test-refresh-secret-key-at-least-32-chars-long-for-hs256",
      JWT_EXPIRES_IN: "15m",
      JWT_REFRESH_EXPIRES_IN: "7d",
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      SOLANA_NETWORK: "devnet",
      PORT: "4001",
      HOST: "0.0.0.0",
      FRONTEND_URL: "http://localhost:3000",
      REDIS_URL: "redis://localhost:6379",
      TIPCHAIN_ADMIN_WALLETS: "",
      RATE_LIMIT_WINDOW_MS: "60000",
      RATE_LIMIT_MAX_REQUESTS: "1000",
      DEFAULT_PAGE_SIZE: "20",
      MAX_PAGE_SIZE: "100",
      REDIS_QUEUE_ENABLED: "false",
    },
  },
});
