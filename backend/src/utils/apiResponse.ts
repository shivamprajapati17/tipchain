import { Response } from "express";
import { ApiResponse, PaginatedResponse, PaginationParams } from "../types/common.types";

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, message, 201);
}

export function sendDeleted(res: Response, message = "Resource deleted successfully"): void {
  sendSuccess(res, null, message);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationParams & { total: number }
): void {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}
