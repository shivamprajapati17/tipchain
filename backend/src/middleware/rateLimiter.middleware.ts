import rateLimit from "express-rate-limit";
import { getEnv } from "../config/env";

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: getEnv().RATE_LIMIT_WINDOW_MS,
  max: getEnv().RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
    timestamp: new Date().toISOString(),
  },
});

/**
 * Strict limiter for auth endpoints (prevent brute force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again later.",
    timestamp: new Date().toISOString(),
  },
});

/**
 * Strict limiter for wallet sign-in
 */
export const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many sign-in attempts. Please try again later.",
    timestamp: new Date().toISOString(),
  },
});

/**
 * Strict limiter for admin endpoints
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many admin requests. Please slow down.",
    timestamp: new Date().toISOString(),
  },
});

/**
 * Limiter for tip submission
 */
export const tipLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many tip requests. Please wait before sending another tip.",
    timestamp: new Date().toISOString(),
  },
});
