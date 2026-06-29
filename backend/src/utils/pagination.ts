import { Request } from "express";

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

export function extractPagination(req: Request, defaultLimit = 20, maxLimit = 100): PaginationResult {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  // Attach to request for downstream use
  req.pagination = { page, limit, skip };

  return { page, limit, skip };
}

export function extractSort(req: Request, defaultField = "createdAt", defaultOrder: "asc" | "desc" = "desc") {
  const field = (req.query.sortBy as string) || defaultField;
  const sortOrder = req.query.sortOrder as string | undefined;
  const order = sortOrder === "asc" ? "asc" : sortOrder === "desc" ? "desc" : defaultOrder;
  return { field, order };
}

export function extractDateRange(req: Request, defaultDays = 30) {
  const days = parseInt(req.query.days as string, 10) || defaultDays;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate, endDate, days: Math.min(days, 365) };
}
