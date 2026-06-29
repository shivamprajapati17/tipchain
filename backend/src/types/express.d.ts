import { UserRole } from "./auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        role: UserRole;
        isAdmin: boolean;
      };
      requestId?: string;
      pagination?: {
        page: number;
        limit: number;
        skip: number;
      };
    }
  }
}

export {};
