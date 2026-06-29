/**
 * @tipchain/database — Database Client & Utilities
 *
 * Prisma client and database utilities for the TipChain platform.
 *
 * @example
 * ```typescript
 * import { getPrisma } from "@tipchain/database";
 *
 * const prisma = getPrisma();
 * const creators = await prisma.creator.findMany();
 * ```
 */

export { getPrisma } from "./prisma";
export type { DatabaseConfig } from "./types";

// ─── Constants ──────────────────────────────────────────────────────────────

export const SCHEMA_VERSION = "2.0.0";
export const SCHEMA_PATH = "../prisma/schema.prisma";
