import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";
import { ApiResponse } from "../types/common.types";
import { JwtPayload, UserRole } from "../types/auth.types";
import logger from "../utils/logger";

/**
 * Authenticate request using JWT Bearer token
 * Attaches decoded user info to req.user
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const response: ApiResponse = {
        success: false,
        error: "Authentication required. Provide a valid Bearer token.",
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    const token = authHeader.split(" ")[1];
    const env = getEnv();

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.sub,
      walletAddress: decoded.wallet,
      role: decoded.role as UserRole,
      isAdmin: decoded.role === UserRole.ADMIN || decoded.role === UserRole.MODERATOR,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const response: ApiResponse = {
        success: false,
        error: "Token expired. Please refresh your token.",
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid token. Please sign in again.",
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    logger.error("Auth middleware error", { error });
    const response: ApiResponse = {
      success: false,
      error: "Authentication failed.",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
  }
}

/**
 * Optional authentication — attaches user if token exists, but doesn't fail if not
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const env = getEnv();
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      req.user = {
        id: decoded.sub,
        walletAddress: decoded.wallet,
        role: decoded.role as UserRole,
        isAdmin: decoded.role === UserRole.ADMIN || decoded.role === UserRole.MODERATOR,
      };
    }
  } catch {
    // Silently continue without user
  }
  next();
}

/**
 * Require a specific role or higher
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: "Authentication required.",
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    if (!roles.includes(req.user.role)) {
      const response: ApiResponse = {
        success: false,
        error: "Insufficient permissions. You do not have the required role.",
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    const response: ApiResponse = {
      success: false,
      error: "Admin access required.",
      timestamp: new Date().toISOString(),
    };
    res.status(403).json(response);
    return;
  }
  next();
}
