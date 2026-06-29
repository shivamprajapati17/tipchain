import Redis from "ioredis";
import logger from "../utils/logger";
import { getEnv, isProduction } from "../config/env";

let redisClient: Redis | null = null;
let isConnected = false;

export function getRedis(): Redis | null {
  if (redisClient) return redisClient;

  try {
    const env = getEnv();
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn("Redis connection failed after 3 retries — running without cache");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on("connect", () => {
      isConnected = true;
      logger.info("Redis connected");
    });

    redisClient.on("error", (err) => {
      isConnected = false;
      logger.error("Redis error", { error: err.message });
    });

    redisClient.on("close", () => {
      isConnected = false;
      logger.warn("Redis connection closed");
    });

    if (isProduction()) {
      redisClient.connect().catch((err) => {
        logger.warn("Redis connection failed — running without cache", { error: err.message });
      });
    }

    return redisClient;
  } catch (error) {
    logger.warn("Redis not available — running without cache");
    return null;
  }
}

export function isRedisConnected(): boolean {
  return isConnected && redisClient?.status === "ready";
}

// Cache helpers
const DEFAULT_TTL = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client || !isConnected) return null;
  try {
    const data = await client.get(key);
    if (data) return JSON.parse(data) as T;
    return null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, data: unknown, ttl = DEFAULT_TTL): Promise<void> {
  const client = getRedis();
  if (!client || !isConnected) return;
  try {
    await client.setex(key, ttl, JSON.stringify(data));
  } catch {
    // silently fail
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client || !isConnected) return;
  try {
    await client.del(key);
  } catch {
    // silently fail
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client || !isConnected) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // silently fail
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info("Redis disconnected");
  }
}
